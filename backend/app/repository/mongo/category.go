package mongo

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"basic-app/apperrors"
	"basic-app/models"
	"basic-app/repository"

	"go.mongodb.org/mongo-driver/v2/bson"
	mongodriver "go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type CategoryRepository struct {
	collection *mongodriver.Collection
}

func NewCategoryRepository(
	db *mongodriver.Database,
) *CategoryRepository {
	return &CategoryRepository{
		collection: db.Collection("categories"),
	}
}

// Create creates a new category.
func (r *CategoryRepository) Create(
	ctx context.Context,
	category *models.Category,
) error {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	now := time.Now().UTC()

	if category.ID.IsZero() {
		category.ID = bson.NewObjectID()
	}

	if category.CreatedAt.IsZero() {
		category.CreatedAt = now
	}

	category.UpdatedAt = now

	category.Name = strings.TrimSpace(category.Name)
	category.Slug = strings.TrimSpace(category.Slug)

	_, err := r.collection.InsertOne(ctx, category)
	return err
}

// FindByID finds a category by MongoDB ObjectID.
func (r *CategoryRepository) FindByID(
	ctx context.Context,
	id string,
) (*models.Category, error) {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, apperrors.ErrInvalidCategoryID
	}

	var category models.Category

	err = r.collection.FindOne(
		ctx,
		bson.M{"_id": objectID},
	).Decode(&category)

	if err != nil {
		if errors.Is(err, mongodriver.ErrNoDocuments) {
			return nil, apperrors.ErrCategoryNotFound
		}
		return nil, err
	}

	return &category, nil
}

// FindBySlug finds a category by slug.
func (r *CategoryRepository) FindBySlug(
	ctx context.Context,
	slug string,
) (*models.Category, error) {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	var category models.Category

	err := r.collection.FindOne(
		ctx,
		bson.M{"slug": strings.TrimSpace(slug)},
	).Decode(&category)

	if err != nil {
		if errors.Is(err, mongodriver.ErrNoDocuments) {
			return nil, apperrors.ErrCategoryNotFound
		}
		return nil, err
	}

	return &category, nil
}

// Update updates category information.
func (r *CategoryRepository) Update(
	ctx context.Context,
	category *models.Category,
) error {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	category.UpdatedAt = time.Now().UTC()

	update := bson.M{
		"$set": bson.M{
			"name":        category.Name,
			"slug":        category.Slug,
			"description": category.Description,
			"parent_id":   category.ParentID,
			"updated_at":  category.UpdatedAt,
		},
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": category.ID},
		update,
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return apperrors.ErrCategoryNotFound
	}

	return nil
}

// UpdateStatus changes category activation status.
func (r *CategoryRepository) UpdateStatus(
	ctx context.Context,
	categoryID string,
	status bool,
) error {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	objectID, err := bson.ObjectIDFromHex(categoryID)
	if err != nil {
		return apperrors.ErrInvalidCategoryID
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		bson.M{
			"$set": bson.M{
				"status":     status,
				"updated_at": time.Now().UTC(),
			},
		},
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return apperrors.ErrCategoryNotFound
	}

	return nil
}

// HasChildren checks whether a category has direct children.
func (r *CategoryRepository) HasChildren(
	ctx context.Context,
	categoryID bson.ObjectID,
) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	count, err := r.collection.CountDocuments(
		ctx,
		bson.M{"parent_id": categoryID},
	)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// Delete permanently removes a category.
func (r *CategoryRepository) Delete(
	ctx context.Context,
	categoryID string,
) error {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	objectID, err := bson.ObjectIDFromHex(categoryID)
	if err != nil {
		return apperrors.ErrInvalidCategoryID
	}

	result, err := r.collection.DeleteOne(
		ctx,
		bson.M{"_id": objectID},
	)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return apperrors.ErrCategoryNotFound
	}

	return nil
}

// ListCategories returns paginated categories.
func (r *CategoryRepository) ListCategories(
	ctx context.Context,
	listFilter repository.CategoryListFilter,
) ([]models.Category, int64, error) {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	filter := bson.M{}

	if listFilter.Status != nil {
		filter["status"] = *listFilter.Status
	}

	if listFilter.ParentID != nil {
		if strings.TrimSpace(*listFilter.ParentID) == "" {
			filter["parent_id"] = nil
		} else {
			parentID, err := bson.ObjectIDFromHex(
				strings.TrimSpace(*listFilter.ParentID),
			)
			if err != nil {
				return nil, 0, apperrors.ErrInvalidCategoryID
			}

			filter["parent_id"] = parentID
		}
	}

	if strings.TrimSpace(listFilter.Search) != "" {
		searchRegex := bson.Regex{
			Pattern: regexp.QuoteMeta(
				strings.TrimSpace(listFilter.Search),
			),
			Options: "i",
		}

		filter["$or"] = bson.A{
			bson.M{"name": searchRegex},
			bson.M{"slug": searchRegex},
			bson.M{"description": searchRegex},
		}
	}

	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	findOptions := options.Find().
		SetSkip(listFilter.Skip).
		SetLimit(listFilter.Limit).
		SetSort(bson.D{
			{Key: "created_at", Value: -1},
		})

	cursor, err := r.collection.Find(
		ctx,
		filter,
		findOptions,
	)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	categories := make([]models.Category, 0)

	if err := cursor.All(ctx, &categories); err != nil {
		return nil, 0, err
	}

	return categories, total, nil
}

// ListAll retrieves all categories for tree construction.
func (r *CategoryRepository) ListAll(
	ctx context.Context,
) ([]models.Category, error) {
	ctx, cancel := context.WithTimeout(ctx, databaseTimeout)
	defer cancel()

	findOptions := options.Find().SetSort(
		bson.D{
			{Key: "name", Value: 1},
		},
	)

	cursor, err := r.collection.Find(
		ctx,
		bson.M{},
		findOptions,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	categories := make([]models.Category, 0)

	if err := cursor.All(ctx, &categories); err != nil {
		return nil, err
	}

	return categories, nil
}

// Compile-time interface verification.
var _ repository.CategoryRepository = (*CategoryRepository)(nil)
