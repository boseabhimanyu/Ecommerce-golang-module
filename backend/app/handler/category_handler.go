package handler

import (
	"errors"
	"net/http"
	"strings"

	"basic-app/apperrors"
	"basic-app/dto"
	"basic-app/services"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categoryService *services.CategoryService
}

func NewCategoryHandler(
	categoryService *services.CategoryService,
) *CategoryHandler {
	return &CategoryHandler{
		categoryService: categoryService,
	}
}

// CreateCategory
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req dto.CreateCategoryRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	category, err := h.categoryService.CreateCategory(
		c.Request.Context(),
		&req,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrCategorySlugExists):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

		case errors.Is(err, apperrors.ErrCategoryNotFound),
			errors.Is(err, apperrors.ErrInvalidCategoryParent),
			errors.Is(err, apperrors.ErrCategoryInactiveParent):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "category created successfully",
		"category": category,
	})
}

// GetCategoryByID
func (h *CategoryHandler) GetCategoryByID(c *gin.Context) {
	categoryID := strings.TrimSpace(c.Param("id"))

	category, err := h.categoryService.GetCategoryByID(
		c.Request.Context(),
		categoryID,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidCategoryID):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		case errors.Is(err, apperrors.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to fetch category"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"category": category,
	})
}

// GetCategoryBySlug
func (h *CategoryHandler) GetCategoryBySlug(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))

	category, err := h.categoryService.GetCategoryBySlug(
		c.Request.Context(),
		slug,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"category": category,
	})
}

// UpdateCategory
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	categoryID := strings.TrimSpace(c.Param("id"))

	var req dto.UpdateCategoryRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	category, err := h.categoryService.UpdateCategory(
		c.Request.Context(),
		categoryID,
		&req,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

		case errors.Is(err, apperrors.ErrCategorySlugExists):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

		case errors.Is(err, apperrors.ErrCategoryCircularParent),
			errors.Is(err, apperrors.ErrCategoryInactiveParent),
			errors.Is(err, apperrors.ErrInvalidCategoryParent):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "category updated successfully",
		"category": category,
	})
}

// UpdateCategoryStatus
func (h *CategoryHandler) UpdateCategoryStatus(c *gin.Context) {
	categoryID := strings.TrimSpace(c.Param("id"))

	var req dto.CategoryStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	if req.Status == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "status is required",
		})
		return
	}

	err := h.categoryService.UpdateCategoryStatus(
		c.Request.Context(),
		categoryID,
		*req.Status,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

		case errors.Is(err, apperrors.ErrCategoryInactiveParent):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "category status updated successfully",
		"status":  *req.Status,
	})
}

// DeleteCategory
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	categoryID := strings.TrimSpace(c.Param("id"))

	err := h.categoryService.DeleteCategory(
		c.Request.Context(),
		categoryID,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})

		case errors.Is(err, apperrors.ErrCategoryHasChildren):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "category deleted successfully",
	})
}

// ListCategories
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	var query dto.ListCategoriesQuery

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid query parameters",
		})
		return
	}

	result, err := h.categoryService.ListCategories(
		c.Request.Context(),
		query,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidPage),
			errors.Is(err, apperrors.ErrInvalidLimit):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "unable to fetch categories",
			})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetCategoryTree
func (h *CategoryHandler) GetCategoryTree(c *gin.Context) {
	includeInactive := c.Query("includeInactive") == "true"

	// Only administrators should receive inactive categories.
	if !includeInactive {
		includeInactive = false
	}

	tree, err := h.categoryService.GetCategoryTree(
		c.Request.Context(),
		includeInactive,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "unable to fetch category tree",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": tree,
	})
}

func (h *CategoryHandler) GetAdminCategoryTree(c *gin.Context) {
	tree, err := h.categoryService.GetCategoryTree(
		c.Request.Context(),
		true,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "unable to fetch category tree",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": tree,
	})
}
