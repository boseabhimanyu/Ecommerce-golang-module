package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Address struct {
	ID        bson.ObjectID `bson:"_id" json:"id"`
	UserID    bson.ObjectID `bson:"user_id" json:"userId"`
	FullName  string        `bson:"full_name" json:"fullName"`
	Phone     string        `bson:"phone" json:"phone"`
	Line1     string        `bson:"line_1" json:"line1"`
	Line2     string        `bson:"line_2" json:"line2"`
	City      string        `bson:"city" json:"city"`
	State     string        `bson:"state" json:"state"`
	PinCode   string        `bson:"pin_code" json:"pinCode"`
	Country   string        `bson:"country" json:"country"`
	IsDefault bool          `bson:"is_default" json:"isDefault"`
	CreatedAt time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time     `bson:"updated_at" json:"updatedAt"`
}

// OrderAddressSnapshot ensures historical order immutability
type OrderAddressSnapshot struct {
	FullName string `bson:"full_name" json:"fullName"`
	Phone    string `bson:"phone" json:"phone"`
	Line1    string `bson:"line_1" json:"line1"`
	Line2    string `bson:"line_2" json:"line2"`
	City     string `bson:"city" json:"city"`
	State    string `bson:"state" json:"state"`
	PinCode  string `bson:"pin_code" json:"pinCode"`
	Country  string `bson:"country" json:"country"`
}
