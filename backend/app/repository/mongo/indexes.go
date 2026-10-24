package mongo

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	mongodriver "go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// User Indexes

func EnsureUserIndexes(
	ctx context.Context,
	db *mongodriver.Database,
) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	collection := db.Collection("users")

	indexes := []mongodriver.IndexModel{
		{
			Keys: bson.D{
				{Key: "email", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_email"),
		},
		{
			Keys: bson.D{
				{Key: "username", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_username"),
		},
		{
			Keys: bson.D{
				{Key: "phone", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_phone"),
		},
		{
			Keys: bson.D{
				{Key: "email_verification_token", Value: 1},
			},
			Options: options.Index().
				SetPartialFilterExpression(
					bson.M{
						"email_verification_token": bson.M{
							"$gt": "",
						},
					},
				).
				SetName("idx_email_verification_token"),
		},
		{
			Keys: bson.D{
				{Key: "password_reset_token", Value: 1},
			},
			Options: options.Index().
				SetPartialFilterExpression(
					bson.M{
						"password_reset_token": bson.M{
							"$gt": "",
						},
					},
				).
				SetName("idx_password_reset_token"),
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)

	return err
}

// Refresh Token index

func EnsureRefreshTokenIndexes(
	ctx context.Context,
	db *mongodriver.Database,
) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	collection := db.Collection("refresh_tokens")

	indexes := []mongodriver.IndexModel{
		{
			Keys: bson.D{
				{Key: "token_hash", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_token_hash"),
		},
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
			},
			Options: options.Index().
				SetName("refresh_token_user_id"),
		},
		{
			Keys: bson.D{
				{Key: "expires_at", Value: 1},
			},
			Options: options.Index().
				SetExpireAfterSeconds(0).
				SetName("refresh_token_expiry"),
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)

	return err
}

// Page indexes

func EnsurePageIndexes(
	ctx context.Context,
	db *mongodriver.Database,
) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	collection := db.Collection("pages")

	indexes := []mongodriver.IndexModel{
		{
			Keys: bson.D{
				{Key: "slug", Value: 1},
			},
			Options: options.Index().
				SetUnique(true).
				SetName("unique_page_slug"),
		},
		{
			Keys: bson.D{
				{Key: "visibility", Value: 1},
				{Key: "created_at", Value: -1},
			},
			Options: options.Index().
				SetName("page_visibility_created_at"),
		},
		{
			Keys: bson.D{
				{Key: "author_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
			Options: options.Index().
				SetName("page_author_created_at"),
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)

	return err
}
