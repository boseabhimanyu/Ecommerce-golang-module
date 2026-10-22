package repository

import (
	"basic-app/models"
	"context"
	"errors"
)

var ErrAddressNotFound = errors.New("address not found")

type AddressRepository interface {
	Create(ctx context.Context, address *models.Address) error
	FindByID(ctx context.Context, id, userID string) (*models.Address, error)
	FindByUserID(ctx context.Context, userID string) ([]*models.Address, error)
	Update(ctx context.Context, id, userID string, address *models.Address) error
	Delete(ctx context.Context, id, userID string) error
	SetDefault(ctx context.Context, id, userID string) error
	ClearDefaultByUserID(ctx context.Context, userID string) error
}
