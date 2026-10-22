package mongo

import (
	"basic-app/models"
	"basic-app/repository"
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoAddressRepository struct {
	collection *mongo.Collection
}

func NewAddressRepository(db *mongo.Database) repository.AddressRepository {
	return &MongoAddressRepository{
		collection: db.Collection("addresses"),
	}
}

func parseObjectID(id string) (bson.ObjectID, error) {
	objID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return bson.NilObjectID, errors.New("invalid object ID")
	}
	return objID, nil
}

func (r *MongoAddressRepository) Create(
	ctx context.Context,
	address *models.Address,
) error {
	if address == nil {
		return errors.New("address is required")
	}

	if address.UserID == bson.NilObjectID {
		return errors.New("user ID is required")
	}

	now := time.Now().UTC()

	address.ID = bson.NewObjectID()
	address.CreatedAt = now
	address.UpdatedAt = now

	_, err := r.collection.InsertOne(ctx, address)
	return err
}

func (r *MongoAddressRepository) FindByID(
	ctx context.Context,
	id, userID string,
) (*models.Address, error) {
	objID, err := parseObjectID(id)
	if err != nil {
		return nil, err
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}

	var address models.Address

	err = r.collection.FindOne(ctx, bson.M{
		"_id":     objID,
		"user_id": userObjID,
	}).Decode(&address)

	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, repository.ErrAddressNotFound
	}
	if err != nil {
		return nil, err
	}

	return &address, nil
}

func (r *MongoAddressRepository) FindByUserID(
	ctx context.Context,
	userID string,
) ([]*models.Address, error) {
	userObjID, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(
		ctx,
		bson.M{"user_id": userObjID},
		options.Find().SetSort(bson.D{
			{Key: "created_at", Value: -1},
		}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	addresses := make([]*models.Address, 0)

	if err := cursor.All(ctx, &addresses); err != nil {
		return nil, err
	}

	return addresses, nil
}

func (r *MongoAddressRepository) Update(
	ctx context.Context,
	id, userID string,
	address *models.Address,
) error {
	if address == nil {
		return errors.New("address is required")
	}

	objID, err := parseObjectID(id)
	if err != nil {
		return err
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return err
	}

	now := time.Now().UTC()

	update := bson.M{
		"$set": bson.M{
			"full_name":  address.FullName,
			"phone":      address.Phone,
			"line_1":     address.Line1,
			"line_2":     address.Line2,
			"city":       address.City,
			"state":      address.State,
			"pin_code":   address.PinCode,
			"country":    address.Country,
			"updated_at": now,
		},
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{
			"_id":     objID,
			"user_id": userObjID,
		},
		update,
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return repository.ErrAddressNotFound
	}

	return nil
}

func (r *MongoAddressRepository) Delete(
	ctx context.Context,
	id, userID string,
) error {
	objID, err := parseObjectID(id)
	if err != nil {
		return err
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return err
	}

	result, err := r.collection.DeleteOne(ctx, bson.M{
		"_id":     objID,
		"user_id": userObjID,
	})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return repository.ErrAddressNotFound
	}

	return nil
}

// SetDefault selects one address belonging to the user.
// The update pipeline sets that address to default and
// clears the default flag on the user's other addresses.
func (r *MongoAddressRepository) SetDefault(
	ctx context.Context,
	id, userID string,
) error {
	objID, err := parseObjectID(id)
	if err != nil {
		return err
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return err
	}

	// Verify that the selected address belongs to this user
	// before changing any default flags.
	err = r.collection.FindOne(ctx, bson.M{
		"_id":     objID,
		"user_id": userObjID,
	}).Err()

	if errors.Is(err, mongo.ErrNoDocuments) {
		return repository.ErrAddressNotFound
	}
	if err != nil {
		return err
	}

	now := time.Now().UTC()

	// Clear the existing default first.
	_, err = r.collection.UpdateMany(
		ctx,
		bson.M{"user_id": userObjID},
		bson.M{
			"$set": bson.M{
				"is_default": false,
				"updated_at": now,
			},
		},
	)
	if err != nil {
		return err
	}

	// Set the selected address as the default.
	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{
			"_id":     objID,
			"user_id": userObjID,
		},
		bson.M{
			"$set": bson.M{
				"is_default": true,
				"updated_at": now,
			},
		},
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return repository.ErrAddressNotFound
	}

	return nil
}

func (r *MongoAddressRepository) ClearDefaultByUserID(
	ctx context.Context,
	userID string,
) error {
	userObjID, err := parseObjectID(userID)
	if err != nil {
		return err
	}

	_, err = r.collection.UpdateMany(
		ctx,
		bson.M{"user_id": userObjID},
		bson.M{
			"$set": bson.M{
				"is_default": false,
				"updated_at": time.Now().UTC(),
			},
		},
	)

	return err
}
