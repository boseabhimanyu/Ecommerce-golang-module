package dto

type CreateAddressRequest struct {
	FullName  string `json:"fullName"`
	Phone     string `json:"phone"`
	Line1     string `json:"line1"`
	Line2     string `json:"line2"`
	City      string `json:"city"`
	State     string `json:"state"`
	PinCode   string `json:"pinCode"`
	Country   string `json:"country"`
	IsDefault bool   `json:"isDefault"`
}

type UpdateAddressRequest struct {
	FullName  *string `json:"fullName"`
	Phone     *string `json:"phone"`
	Line1     *string `json:"line1"`
	Line2     *string `json:"line2"`
	City      *string `json:"city"`
	State     *string `json:"state"`
	PinCode   *string `json:"pinCode"`
	Country   *string `json:"country"`
	IsDefault *bool   `json:"isDefault"`
}

type AddressResponse struct {
	ID        string `json:"id"`
	FullName  string `json:"fullName"`
	Phone     string `json:"phone"`
	Line1     string `json:"line1"`
	Line2     string `json:"line2"`
	City      string `json:"city"`
	State     string `json:"state"`
	PinCode   string `json:"pinCode"`
	Country   string `json:"country"`
	IsDefault bool   `json:"isDefault"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}
