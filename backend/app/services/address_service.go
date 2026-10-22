package services

import (
	"basic-app/dto"
	"basic-app/models"
	"basic-app/repository"
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/v2/bson"
)

var ErrInvalidAddress = errors.New("address is required")

type AddressService struct {
	repo repository.AddressRepository
}

func NewAddressService(repo repository.AddressRepository) *AddressService {
	return &AddressService{repo: repo}
}

func (s *AddressService) AddAddress(
	ctx context.Context,
	userID bson.ObjectID,
	address *models.Address,
) error {
	if address == nil {
		return ErrInvalidAddress
	}

	if userID == bson.NilObjectID {
		return errors.New("invalid user ID")
	}

	address.UserID = userID

	// Check existing addresses.
	addresses, err := s.repo.FindByUserID(ctx, userID.Hex())
	if err != nil {
		return err
	}

	// First address is always default.
	makeDefault := address.IsDefault || len(addresses) == 0

	// Insert without changing the existing default.
	address.IsDefault = false

	if err := s.repo.Create(ctx, address); err != nil {
		return err
	}

	// Set default only when explicitly requested or this is
	// the user's first address.
	if makeDefault {
		if err := s.repo.SetDefault(
			ctx,
			address.ID.Hex(),
			userID.Hex(),
		); err != nil {
			return err
		}

		address.IsDefault = true
	}

	return nil
}

func (s *AddressService) UpdateAddress(
	ctx context.Context,
	addressID, userID bson.ObjectID,
	address *models.Address,
) error {
	if address == nil {
		return ErrInvalidAddress
	}

	if addressID == bson.NilObjectID || userID == bson.NilObjectID {
		return errors.New("invalid address or user ID")
	}

	// If explicitly marked as default, make this the user's default.
	if address.IsDefault {
		if err := s.repo.SetDefault(
			ctx,
			addressID.Hex(),
			userID.Hex(),
		); err != nil {
			return err
		}
	}

	// Update ordinary fields without overwriting default status.
	return s.repo.Update(
		ctx,
		addressID.Hex(),
		userID.Hex(),
		address,
	)
}

func (s *AddressService) GetUserAddresses(
	ctx context.Context,
	userID bson.ObjectID,
) ([]*models.Address, error) {
	if userID == bson.NilObjectID {
		return nil, errors.New("invalid user ID")
	}

	return s.repo.FindByUserID(ctx, userID.Hex())
}

func (s *AddressService) GetAddress(
	ctx context.Context,
	addressID, userID bson.ObjectID,
) (*models.Address, error) {
	if addressID == bson.NilObjectID || userID == bson.NilObjectID {
		return nil, errors.New("invalid address or user ID")
	}

	return s.repo.FindByID(
		ctx,
		addressID.Hex(),
		userID.Hex(),
	)
}

func (s *AddressService) SetDefaultAddress(
	ctx context.Context,
	addressID, userID bson.ObjectID,
) error {
	if addressID == bson.NilObjectID || userID == bson.NilObjectID {
		return errors.New("invalid address or user ID")
	}

	return s.repo.SetDefault(
		ctx,
		addressID.Hex(),
		userID.Hex(),
	)
}

func (s *AddressService) DeleteAddress(
	ctx context.Context,
	addressID, userID bson.ObjectID,
) error {
	if addressID == bson.NilObjectID || userID == bson.NilObjectID {
		return errors.New("invalid address or user ID")
	}

	// Verify ownership and determine whether this is the default.
	address, err := s.repo.FindByID(
		ctx,
		addressID.Hex(),
		userID.Hex(),
	)
	if err != nil {
		return err
	}

	// Remember a replacement before deleting the current default.
	var replacementID bson.ObjectID

	if address.IsDefault {
		addresses, err := s.repo.FindByUserID(ctx, userID.Hex())
		if err != nil {
			return err
		}

		for _, candidate := range addresses {
			if candidate.ID != addressID {
				replacementID = candidate.ID
				break
			}
		}
	}

	if err := s.repo.Delete(
		ctx,
		addressID.Hex(),
		userID.Hex(),
	); err != nil {
		return err
	}

	// Promote another saved address if the deleted one was default.
	if address.IsDefault && replacementID != bson.NilObjectID {
		return s.repo.SetDefault(
			ctx,
			replacementID.Hex(),
			userID.Hex(),
		)
	}

	// If no addresses remain, there is no default address.
	return nil
}

func ApplyAddressUpdate(
	address *models.Address,
	req dto.UpdateAddressRequest,
) {
	if req.FullName != nil {
		address.FullName = *req.FullName
	}
	if req.Phone != nil {
		address.Phone = *req.Phone
	}
	if req.Line1 != nil {
		address.Line1 = *req.Line1
	}
	if req.Line2 != nil {
		address.Line2 = *req.Line2
	}
	if req.City != nil {
		address.City = *req.City
	}
	if req.State != nil {
		address.State = *req.State
	}
	if req.PinCode != nil {
		address.PinCode = *req.PinCode
	}
	if req.Country != nil {
		address.Country = *req.Country
	}
}
