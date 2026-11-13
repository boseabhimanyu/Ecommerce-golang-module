package repository

import (
	"context"

	"basic-app/models"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryListFilter struct {
	Status   *bool
	Search   string
	ParentID *string
	Skip     int64
	Limit    int64
}

type CategoryRepository interface {
	Create(
		ctx context.Context,
		category *models.Category,
	) error

	FindByID(
		ctx context.Context,
		id string,
	) (*models.Category, error)

	FindBySlug(
		ctx context.Context,
		slug string,
	) (*models.Category, error)

	Update(
		ctx context.Context,
		category *models.Category,
	) error

	UpdateStatus(
		ctx context.Context,
		categoryID string,
		status bool,
	) error

	Delete(
		ctx context.Context,
		categoryID string,
	) error

	HasChildren(
		ctx context.Context,
		categoryID bson.ObjectID,
	) (bool, error)

	ListCategories(
		ctx context.Context,
		filter CategoryListFilter,
	) ([]models.Category, int64, error)

	ListAll(
		ctx context.Context,
	) ([]models.Category, error)
}
