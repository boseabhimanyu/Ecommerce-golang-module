package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Category struct {
	ID          bson.ObjectID  `bson:"_id" json:"id"`
	Name        string         `bson:"name" json:"name"`
	Slug        string         `bson:"slug" json:"slug"`
	Description string         `bson:"description" json:"description"`
	ParentID    *bson.ObjectID `bson:"parent_id" json:"parentId"`
	Image       string         `bson:"image" json:"image"`
	Status      bool           `bson:"status" json:"status"`

	CreatedAt time.Time `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time `bson:"updated_at" json:"updatedAt"`
}

func NewCategory() Category {
	now := time.Now().UTC()

	return Category{
		Status:    true,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
