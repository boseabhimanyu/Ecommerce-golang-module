package dto

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// CreateCategoryRequest contains the fields required
// to create a root or child category.
type CreateCategoryRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	ParentID    *string `json:"parentId"`
}

// UpdateCategoryRequest supports partial category updates.
// nil means the field was not provided.
type UpdateCategoryRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	ParentID    *string `json:"parentId"`
}

// CategoryStatusRequest contains category activation status.
type CategoryStatusRequest struct {
	Status *bool `json:"status"`
}

// ListCategoriesQuery contains category listing filters.
type ListCategoriesQuery struct {
	Page     *int    `form:"page"`
	Limit    *int    `form:"limit"`
	Status   *bool   `form:"status"`
	Search   string  `form:"search"`
	ParentID *string `form:"parentId"`
}

// CategoryResponse represents a category in API responses.
type CategoryResponse struct {
	ID          bson.ObjectID  `json:"id"`
	Name        string         `json:"name"`
	Slug        string         `json:"slug"`
	Description string         `json:"description"`
	ParentID    *bson.ObjectID `json:"parentId"`
	Image       string         `json:"image"`
	Status      bool           `json:"status"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

// CategoryListResponse contains paginated categories.
type CategoryListResponse struct {
	Categories []CategoryResponse `json:"categories"`
	Pagination Pagination         `json:"pagination"`
}

// CategoryTreeResponse represents a category
// with its nested child categories.
type CategoryTreeResponse struct {
	ID          bson.ObjectID          `json:"id"`
	Name        string                 `json:"name"`
	Slug        string                 `json:"slug"`
	Description string                 `json:"description"`
	ParentID    *bson.ObjectID         `json:"parentId"`
	Image       string                 `json:"image"`
	Status      bool                   `json:"status"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
	Children    []CategoryTreeResponse `json:"children"`
}
