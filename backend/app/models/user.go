// models/user.go
package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleCustomer UserRole = "customer"
)

type User struct {
	ID bson.ObjectID `bson:"_id" json:"id"`

	FirstName string `bson:"first_name" json:"firstName"`
	LastName  string `bson:"last_name" json:"lastName"`
	Username  string `bson:"username" json:"username"`
	Email     string `bson:"email" json:"email"`
	AltEmail  string `bson:"alt_email" json:"altEmail"`
	Phone     string `bson:"phone" json:"phone"`

	Role       UserRole `bson:"role" json:"role"`
	ProfilePic string   `bson:"profile_pic" json:"profilePic"`
	Status     bool     `bson:"status" json:"status"`

	PasswordHash string `bson:"password_hash" json:"-"`

	CreatedAt   time.Time  `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time  `bson:"updated_at" json:"updatedAt"`
	LastLoginAt *time.Time `bson:"last_login_at" json:"lastLoginAt"`
	DateOfBirth *time.Time `bson:"date_of_birth" json:"dateOfBirth"`

	TwoFactorEnabled       bool     `bson:"two_factor_enabled" json:"twoFactorEnabled"`
	TwoFactorSecret        string   `bson:"two_factor_secret" json:"-"`
	TwoFactorPendingSecret string   `bson:"two_factor_pending_secret" json:"-"`
	BackupCodeHashes       []string `bson:"backup_code_hashes" json:"-"`

	IsEmailVerified         bool       `bson:"is_email_verified" json:"isEmailVerified"`
	EmailVerificationToken  string     `bson:"email_verification_token" json:"-"`
	EmailVerificationExpiry *time.Time `bson:"email_verification_expiry" json:"-"`
	PasswordResetToken      string     `bson:"password_reset_token" json:"-"`
	PasswordResetExpiry     *time.Time `bson:"password_reset_expiry" json:"-"`
}

func NewCustomerUser() User {
	now := time.Now().UTC()
	return User{
		Role:      RoleCustomer,
		Status:    true,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
