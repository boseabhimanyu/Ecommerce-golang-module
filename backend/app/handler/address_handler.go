package handler

import (
	"basic-app/dto"
	"basic-app/models"
	"basic-app/repository"
	"basic-app/services"
	"basic-app/validation"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type AddressHandler struct {
	service *services.AddressService
}

func NewAddressHandler(service *services.AddressService) *AddressHandler {
	return &AddressHandler{service: service}
}

// authenticatedUserID gets the user ID set by authentication middleware.
func authenticatedUserID(c *gin.Context) (bson.ObjectID, bool) {
	userIDStr := c.GetString("userID")

	userID, err := bson.ObjectIDFromHex(userIDStr)
	if err != nil || userID == bson.NilObjectID {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid user session",
		})
		return bson.NilObjectID, false
	}

	return userID, true
}

func addressResponse(address *models.Address) dto.AddressResponse {
	return dto.AddressResponse{
		ID:        address.ID.Hex(),
		FullName:  address.FullName,
		Phone:     address.Phone,
		Line1:     address.Line1,
		Line2:     address.Line2,
		City:      address.City,
		State:     address.State,
		PinCode:   address.PinCode,
		Country:   address.Country,
		IsDefault: address.IsDefault,
		CreatedAt: address.CreatedAt.Format(time.RFC3339),
		UpdatedAt: address.UpdatedAt.Format(time.RFC3339),
	}
}

func respondAddressError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrAddressNotFound):
		c.JSON(http.StatusNotFound, gin.H{
			"error": "address not found",
		})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "address operation failed",
		})
	}
}

func (h *AddressHandler) CreateAddress(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		return
	}

	var req dto.CreateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid address request",
		})
		return
	}

	if strings.TrimSpace(req.FullName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	if strings.TrimSpace(req.Phone) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone is required"})
		return
	}

	// Validate phone and return its specific error.
	phone, err := validation.ValidatePhone(strings.TrimSpace(req.Phone))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if strings.TrimSpace(req.Line1) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "address line 1 is required"})
		return
	}

	if strings.TrimSpace(req.City) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city is required"})
		return
	}

	if strings.TrimSpace(req.PinCode) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "postal code is required"})
		return
	}

	if strings.TrimSpace(req.State) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "state is required"})
		return
	}

	if strings.TrimSpace(req.Country) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "country is required"})
		return
	}

	address := &models.Address{
		FullName:  strings.TrimSpace(req.FullName),
		Phone:     phone,
		Line1:     strings.TrimSpace(req.Line1),
		Line2:     strings.TrimSpace(req.Line2),
		City:      strings.TrimSpace(req.City),
		State:     strings.TrimSpace(req.State),
		PinCode:   strings.TrimSpace(req.PinCode),
		Country:   strings.TrimSpace(req.Country),
		IsDefault: req.IsDefault,
	}

	if err := h.service.AddAddress(
		c.Request.Context(),
		userID,
		address,
	); err != nil {
		log.Printf("failed to save address: %v", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to save address",
		})
		return
	}

	c.JSON(http.StatusCreated, addressResponse(address))
}

func (h *AddressHandler) ListAddresses(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		return
	}

	addresses, err := h.service.GetUserAddresses(
		c.Request.Context(),
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch addresses",
		})
		return
	}

	response := make([]dto.AddressResponse, 0, len(addresses))
	for _, address := range addresses {
		response = append(response, addressResponse(address))
	}

	c.JSON(http.StatusOK, response)
}

func (h *AddressHandler) GetAddress(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		return
	}

	addressID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil || addressID == bson.NilObjectID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid address ID",
		})
		return
	}

	address, err := h.service.GetAddress(
		c.Request.Context(),
		addressID,
		userID,
	)
	if err != nil {
		respondAddressError(c, err)
		return
	}

	c.JSON(http.StatusOK, addressResponse(address))
}

func (h *AddressHandler) UpdateAddress(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		return
	}

	addressID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil || addressID == bson.NilObjectID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid address ID",
		})
		return
	}

	var req dto.UpdateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid address request",
		})
		return
	}

	// Reject an empty PATCH request.
	if req.FullName == nil &&
		req.Phone == nil &&
		req.Line1 == nil &&
		req.Line2 == nil &&
		req.City == nil &&
		req.State == nil &&
		req.PinCode == nil &&
		req.Country == nil &&
		req.IsDefault == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "provide at least one field to update",
		})
		return
	}

	// Fetch the address using both address ID and authenticated user ID.
	address, err := h.service.GetAddress(
		c.Request.Context(),
		addressID,
		userID,
	)
	if err != nil {
		respondAddressError(c, err)
		return
	}

	// Apply only the fields provided in the PATCH request.
	services.ApplyAddressUpdate(address, req)

	// Validate the resulting address before saving.
	if strings.TrimSpace(address.FullName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "name is required",
		})
		return
	}

	if strings.TrimSpace(address.Phone) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "phone is required",
		})
		return
	}

	phone, err := validation.ValidatePhone(
		strings.TrimSpace(address.Phone),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}
	address.Phone = phone

	if strings.TrimSpace(address.Line1) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "address line 1 is required",
		})
		return
	}

	if strings.TrimSpace(address.City) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "city is required",
		})
		return
	}

	if strings.TrimSpace(address.PinCode) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "postal code is required",
		})
		return
	}

	if strings.TrimSpace(address.State) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "state is required",
		})
		return
	}

	if strings.TrimSpace(address.Country) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "country is required",
		})
		return
	}

	// Update the address once, after all validation succeeds.
	if err := h.service.UpdateAddress(
		c.Request.Context(),
		addressID,
		userID,
		address,
	); err != nil {
		respondAddressError(c, err)
		return
	}

	// Re-fetch to return the persisted values and UpdatedAt.
	address, err = h.service.GetAddress(
		c.Request.Context(),
		addressID,
		userID,
	)
	if err != nil {
		respondAddressError(c, err)
		return
	}

	c.JSON(http.StatusOK, addressResponse(address))
}

func (h *AddressHandler) SetDefaultAddress(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		return
	}

	addressID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil || addressID == bson.NilObjectID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid address ID",
		})
		return
	}

	if err := h.service.SetDefaultAddress(
		c.Request.Context(),
		addressID,
		userID,
	); err != nil {
		respondAddressError(c, err)
		return
	}

	// Fetch the updated address.
	address, err := h.service.GetAddress(
		c.Request.Context(),
		addressID,
		userID,
	)
	if err != nil {
		respondAddressError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "default address updated successfully",
		"address": addressResponse(address),
	})
}
func (h *AddressHandler) DeleteAddress(c *gin.Context) {
	userID, ok := authenticatedUserID(c)
	if !ok {
		return
	}

	addressID, err := bson.ObjectIDFromHex(c.Param("id"))
	if err != nil || addressID == bson.NilObjectID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid address ID",
		})
		return
	}

	if err := h.service.DeleteAddress(
		c.Request.Context(),
		addressID,
		userID,
	); err != nil {
		respondAddressError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "address deleted successfully",
	})
}
