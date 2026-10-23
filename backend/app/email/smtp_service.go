package email

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
)

type SMTPEmailService struct {
	host        string
	port        int
	username    string
	password    string
	fromEmail   string
	fromName    string
	frontendURL string
}

func NewSMTPEmailService(
	host string,
	port int,
	username string,
	password string,
	fromEmail string,
	fromName string,
	frontendURL string,
) Service {
	return &SMTPEmailService{
		host:        host,
		port:        port,
		username:    username,
		password:    password,
		fromEmail:   fromEmail,
		fromName:    fromName,
		frontendURL: frontendURL,
	}
}

func (s *SMTPEmailService) SendVerificationEmail(to, name, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.frontendURL, token)
	subject := "Verify Your Email Address"

	body := fmt.Sprintf(`Hi %s,

Thank you for creating an account with us. Please verify your email address by clicking the link below:

%s

This verification link will expire in 24 hours.

If you did not register for this account, please ignore this email.
`, name, verifyURL)

	return s.sendMail(to, subject, body)
}

func (s *SMTPEmailService) SendPasswordResetEmail(to, name, token string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, token)
	subject := "Reset Your Password"

	body := fmt.Sprintf(`Hi %s,

We received a request to reset your password. Click the link below to set a new password:

%s

This link is valid for 1 hour. If you did not request a password reset, you can safely disregard this message.
`, name, resetURL)

	return s.sendMail(to, subject, body)
}

func (s *SMTPEmailService) sendMail(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	fromHeader := fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)

	msg := fmt.Appendf(nil,
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/plain; charset=UTF-8\r\n"+
			"\r\n"+
			"%s\r\n",
		fromHeader,
		to,
		subject,
		body,
	)

	auth := smtp.PlainAuth("", s.username, s.password, s.host)

	// Support port 465 (Direct SSL)
	if s.port == 465 {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: false,
			ServerName:         s.host,
		}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("failed to dial SMTP via TLS: %w", err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, s.host)
		if err != nil {
			return fmt.Errorf("failed to create SMTP client: %w", err)
		}
		defer client.Quit()

		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP auth error: %w", err)
		}
		if err = client.Mail(s.fromEmail); err != nil {
			return err
		}
		if err = client.Rcpt(to); err != nil {
			return err
		}
		w, err := client.Data()
		if err != nil {
			return err
		}
		_, err = w.Write(msg)
		if err != nil {
			return err
		}
		return w.Close()
	}

	// Default port 587 / 25
	return smtp.SendMail(addr, auth, s.fromEmail, []string{to}, msg)
}
