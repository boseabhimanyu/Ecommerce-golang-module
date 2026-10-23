package config

import (
	"basic-app/email"
	"os"
	"strconv"
	"time"
)

type EmailConfig struct {
	Provider                string // "logger" or "smtp"
	Host                    string
	Port                    int
	Username                string
	Password                string
	FromEmail               string
	FromName                string
	FrontendURL             string
	EmailVerificationExpiry time.Duration
	PasswordResetExpiry     time.Duration
}

// LoadEmailConfig reads email-specific environment variables with sensible defaults.
func LoadEmailConfig(defaultFrontendURL string) EmailConfig {
	port, err := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if err != nil || port == 0 {
		port = 587
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = defaultFrontendURL
	}

	provider := os.Getenv("EMAIL_PROVIDER")
	if provider == "" {
		provider = "logger" // Safe dev fallback
	}

	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "Store Support"
	}

	// 1. Email Verification Expiry (default: 24 hours)
	emailVerifExpiry, err := time.ParseDuration(os.Getenv("EMAIL_VERIFICATION_EXPIRY"))
	if err != nil || emailVerifExpiry <= 0 {
		emailVerifExpiry = 24 * time.Hour
	}

	// 2. Password Reset Expiry (default: 1 hour)
	passResetExpiry, err := time.ParseDuration(os.Getenv("PASSWORD_RESET_EXPIRY"))
	if err != nil || passResetExpiry <= 0 {
		passResetExpiry = 1 * time.Hour
	}

	return EmailConfig{
		Provider:                provider,
		Host:                    os.Getenv("SMTP_HOST"),
		Port:                    port,
		Username:                os.Getenv("SMTP_USERNAME"),
		Password:                os.Getenv("SMTP_PASSWORD"),
		FromEmail:               os.Getenv("SMTP_FROM_EMAIL"),
		FromName:                fromName,
		FrontendURL:             frontendURL,
		EmailVerificationExpiry: emailVerifExpiry,
		PasswordResetExpiry:     passResetExpiry,
	}
}

// InitEmailService initializes and returns the configured email.Service implementation.
func (c EmailConfig) InitEmailService() email.Service {
	if c.Provider == "smtp" && c.Host != "" && c.FromEmail != "" {
		return email.NewSMTPEmailService(
			c.Host,
			c.Port,
			c.Username,
			c.Password,
			c.FromEmail,
			c.FromName,
			c.FrontendURL,
		)
	}

	// Default to console logger
	return email.NewLoggerEmailService(c.FrontendURL)
}
