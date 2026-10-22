package mongo

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	driver "go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func EnsureAddressIndexes(
	ctx context.Context,
	db *driver.Database,
) error {
	collection := db.Collection("addresses")

	models := []driver.IndexModel{
		// Efficiently list a user's addresses newest first.
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},

		// Only one address per user may have is_default=true.
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
			},
			Options: options.Index().
				SetName("one_default_address_per_user").
				SetUnique(true).
				SetPartialFilterExpression(
					bson.M{"is_default": true},
				),
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, models)
	return err
}
