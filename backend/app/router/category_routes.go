package router

import (
	"basic-app/auth"
	"basic-app/handler"

	"github.com/gin-gonic/gin"
)

func registerCategoryRoutes(
	r *gin.Engine,
	categoryHandler *handler.CategoryHandler,
	authMiddleware gin.HandlerFunc,
) {
	api := r.Group("/api/v1")

	// Public category routes
	categories := api.Group("/categories")
	{
		categories.GET("", categoryHandler.ListCategories)
		categories.GET("/tree", categoryHandler.GetCategoryTree)
		categories.GET("/slug/:slug", categoryHandler.GetCategoryBySlug)
		categories.GET("/:id", categoryHandler.GetCategoryByID)
	}

	// Admin category routes
	adminCategories := api.Group("/admin/categories")
	adminCategories.Use(
		authMiddleware,
		auth.RequireRoles("admin"),
	)
	{
		adminCategories.POST("", categoryHandler.CreateCategory)
		adminCategories.PATCH("/:id", categoryHandler.UpdateCategory)
		adminCategories.PATCH("/:id/status", categoryHandler.UpdateCategoryStatus)
		adminCategories.DELETE("/:id", categoryHandler.DeleteCategory)

		// Admin can view inactive categories.
		adminCategories.GET("/tree", categoryHandler.GetAdminCategoryTree)
	}
}
