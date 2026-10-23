package email

import (
	"fmt"
	"log"
)

type LoggerEmailService struct {
	frontendURL string // e.g., "http://localhost:3000"
}

func NewLoggerEmailService(frontendURL string) Service {
	return &LoggerEmailService{
		frontendURL: frontendURL,
	}
}

func (s *LoggerEmailService) SendVerificationEmail(to, name, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.frontendURL, token)

	log.Println("================== [DEV EMAIL DISPATCH] ==================")
	log.Printf("To:      %s (%s)\n", to, name)
	log.Printf("Subject: Verify Your Email Address\n")
	log.Printf("Action:  Click the link below to verify your account:\n")
	log.Printf("Link:    %s\n", verifyURL)
	log.Println("==========================================================")

	return nil
}

func (s *LoggerEmailService) SendPasswordResetEmail(to, name, token string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, token)

	log.Println("================== [DEV EMAIL DISPATCH] ==================")
	log.Printf("To:      %s (%s)\n", to, name)
	log.Printf("Subject: Reset Your Password\n")
	log.Printf("Action:  Click the link below to reset your password:\n")
	log.Printf("Link:    %s\n", resetURL)
	log.Println("==========================================================")

	return nil
}
