package services

import (
	"context"
	"errors"
	"strings"
	"unicode"

	"basic-app/apperrors"
	"basic-app/dto"
	"basic-app/models"
	"basic-app/repository"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryService struct {
	categoryRepository repository.CategoryRepository
}

func NewCategoryService(
	categoryRepository repository.CategoryRepository,
) *CategoryService {
	return &CategoryService{
		categoryRepository: categoryRepository,
	}
}

// generateCategorySlug generates a URL-friendly slug.
func generateCategorySlug(name string) string {
	name = strings.ToLower(strings.TrimSpace(name))

	var builder strings.Builder
	previousHyphen := false

	for _, character := range name {
		switch {
		case unicode.IsLetter(character) || unicode.IsDigit(character):
			builder.WriteRune(character)
			previousHyphen = false

		case unicode.IsSpace(character) || character == '-' || character == '_':
			if builder.Len() > 0 && !previousHyphen {
				builder.WriteRune('-')
				previousHyphen = true
			}
		}
	}

	return strings.Trim(builder.String(), "-")
}

// validateCategoryName validates and normalizes category name.
func validateCategoryName(name string) (string, error) {
	name = strings.TrimSpace(name)

	if name == "" {
		return "", apperrors.ErrCategoryNameRequired
	}

	if len([]rune(name)) < 2 || len([]rune(name)) > 100 {
		return "", apperrors.ErrInvalidCategoryName
	}

	return name, nil
}

// validateCategoryDescription validates description.
func validateCategoryDescription(description string) (string, error) {
	description = strings.TrimSpace(description)

	if len([]rune(description)) > 1000 {
		return "", errors.New(
			"category description must not exceed 1000 characters",
		)
	}

	return description, nil
}

// validateParent validates a parent category.
func (s *CategoryService) validateParent(
	ctx context.Context,
	parentID string,
) (*bson.ObjectID, error) {
	parentID = strings.TrimSpace(parentID)

	if parentID == "" {
		return nil, apperrors.ErrInvalidCategoryParent
	}

	parent, err := s.categoryRepository.FindByID(
		ctx,
		parentID,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrCategoryNotFound) {
			return nil, apperrors.ErrInvalidCategoryParent
		}

		return nil, err
	}

	if !parent.Status {
		return nil, apperrors.ErrCategoryInactiveParent
	}

	return &parent.ID, nil
}

// checkSlugAvailability checks whether a slug is already used.
func (s *CategoryService) checkSlugAvailability(
	ctx context.Context,
	slug string,
	currentCategoryID bson.ObjectID,
) error {
	existing, err := s.categoryRepository.FindBySlug(
		ctx,
		slug,
	)

	if err != nil {
		if errors.Is(err, apperrors.ErrCategoryNotFound) {
			return nil
		}

		return err
	}

	if existing.ID != currentCategoryID {
		return apperrors.ErrCategorySlugExists
	}

	return nil
}

// CreateCategory creates a root or child category.
func (s *CategoryService) CreateCategory(
	ctx context.Context,
	req *dto.CreateCategoryRequest,
) (*models.Category, error) {
	if req == nil {
		return nil, errors.New(
			"create category request is required",
		)
	}

	name, err := validateCategoryName(req.Name)
	if err != nil {
		return nil, err
	}

	description, err := validateCategoryDescription(
		req.Description,
	)
	if err != nil {
		return nil, err
	}

	slug := generateCategorySlug(name)

	if slug == "" {
		return nil, apperrors.ErrInvalidCategoryName
	}

	// Check slug uniqueness.
	if err := s.checkSlugAvailability(
		ctx,
		slug,
		bson.ObjectID{},
	); err != nil {
		return nil, err
	}

	var parentID *bson.ObjectID

	if req.ParentID != nil {
		parentID, err = s.validateParent(
			ctx,
			*req.ParentID,
		)
		if err != nil {
			return nil, err
		}
	}

	category := models.NewCategory()

	category.Name = name
	category.Slug = slug
	category.Description = description
	category.ParentID = parentID

	if err := s.categoryRepository.Create(
		ctx,
		&category,
	); err != nil {
		return nil, err
	}

	return &category, nil
}

// GetCategoryByID returns a category by ID.
func (s *CategoryService) GetCategoryByID(
	ctx context.Context,
	categoryID string,
) (*models.Category, error) {
	categoryID = strings.TrimSpace(categoryID)

	if categoryID == "" {
		return nil, apperrors.ErrInvalidCategoryID
	}

	return s.categoryRepository.FindByID(
		ctx,
		categoryID,
	)
}

// GetCategoryBySlug returns a category by slug.
func (s *CategoryService) GetCategoryBySlug(
	ctx context.Context,
	slug string,
) (*models.Category, error) {
	slug = strings.TrimSpace(slug)

	if slug == "" {
		return nil, apperrors.ErrInvalidCategoryName
	}

	return s.categoryRepository.FindBySlug(
		ctx,
		slug,
	)
}

// preventsCategoryCycle checks whether assigning a new parent
// would create a circular hierarchy.
func (s *CategoryService) preventsCategoryCycle(
	ctx context.Context,
	categoryID bson.ObjectID,
	newParentID bson.ObjectID,
) error {
	if categoryID == newParentID {
		return apperrors.ErrCategoryCircularParent
	}

	currentParentID := newParentID

	visited := make(map[bson.ObjectID]bool)

	for {
		if currentParentID == categoryID {
			return apperrors.ErrCategoryCircularParent
		}

		if visited[currentParentID] {
			return apperrors.ErrCategoryCircularParent
		}

		visited[currentParentID] = true

		parent, err := s.categoryRepository.FindByID(
			ctx,
			currentParentID.Hex(),
		)

		if err != nil {
			if errors.Is(err, apperrors.ErrCategoryNotFound) {
				return apperrors.ErrInvalidCategoryParent
			}

			return err
		}

		if parent.ParentID == nil {
			break
		}

		currentParentID = *parent.ParentID
	}

	return nil
}

// UpdateCategory updates category information.
func (s *CategoryService) UpdateCategory(
	ctx context.Context,
	categoryID string,
	req *dto.UpdateCategoryRequest,
) (*models.Category, error) {
	categoryID = strings.TrimSpace(categoryID)

	if categoryID == "" {
		return nil, apperrors.ErrInvalidCategoryID
	}

	if req == nil {
		return nil, apperrors.ErrNoCategoryFields
	}

	currentCategory, err := s.categoryRepository.FindByID(
		ctx,
		categoryID,
	)
	if err != nil {
		return nil, err
	}

	// Work on a copy.
	category := *currentCategory
	hasUpdates := false

	if req.Name != nil {
		name, err := validateCategoryName(*req.Name)
		if err != nil {
			return nil, err
		}

		slug := generateCategorySlug(name)

		if slug == "" {
			return nil, apperrors.ErrInvalidCategoryName
		}

		if slug != category.Slug {
			if err := s.checkSlugAvailability(
				ctx,
				slug,
				category.ID,
			); err != nil {
				return nil, err
			}
		}

		category.Name = name
		category.Slug = slug
		hasUpdates = true
	}

	if req.Description != nil {
		description, err := validateCategoryDescription(
			*req.Description,
		)
		if err != nil {
			return nil, err
		}

		category.Description = description
		hasUpdates = true
	}

	if req.ParentID != nil {
		parentID, err := s.validateParent(
			ctx,
			*req.ParentID,
		)
		if err != nil {
			return nil, err
		}

		// Prevent circular category hierarchy.
		if err := s.preventsCategoryCycle(
			ctx,
			category.ID,
			*parentID,
		); err != nil {
			return nil, err
		}

		// Validate that the parent and all its ancestors are active.
		parent, err := s.categoryRepository.FindByID(
			ctx,
			parentID.Hex(),
		)
		if err != nil {
			return nil, err
		}

		if err := s.validateActiveAncestors(
			ctx,
			parent,
		); err != nil {
			return nil, err
		}

		category.ParentID = parentID
		hasUpdates = true
	}

	if !hasUpdates {
		return nil, apperrors.ErrNoCategoryFields
	}

	if err := s.categoryRepository.Update(
		ctx,
		&category,
	); err != nil {
		return nil, err
	}

	return &category, nil
}

// UpdateCategoryStatus changes category activation status.
func (s *CategoryService) UpdateCategoryStatus(
	ctx context.Context,
	categoryID string,
	status bool,
) error {
	categoryID = strings.TrimSpace(categoryID)

	if categoryID == "" {
		return apperrors.ErrInvalidCategoryID
	}

	category, err := s.categoryRepository.FindByID(
		ctx,
		categoryID,
	)
	if err != nil {
		return err
	}

	if category.Status == status {
		return nil
	}

	// When activating a category, its parent must be active.
	if status && category.ParentID != nil {
		parent, err := s.categoryRepository.FindByID(
			ctx,
			category.ParentID.Hex(),
		)
		if err != nil {
			return err
		}

		if !parent.Status {
			return apperrors.ErrCategoryInactiveParent
		}
	}

	return s.categoryRepository.UpdateStatus(
		ctx,
		categoryID,
		status,
	)
}

// DeleteCategory deletes a category without children.
func (s *CategoryService) DeleteCategory(
	ctx context.Context,
	categoryID string,
) error {
	categoryID = strings.TrimSpace(categoryID)

	if categoryID == "" {
		return apperrors.ErrInvalidCategoryID
	}

	category, err := s.categoryRepository.FindByID(
		ctx,
		categoryID,
	)
	if err != nil {
		return err
	}

	hasChildren, err := s.categoryRepository.HasChildren(
		ctx,
		category.ID,
	)
	if err != nil {
		return err
	}

	if hasChildren {
		return apperrors.ErrCategoryHasChildren
	}

	return s.categoryRepository.Delete(
		ctx,
		categoryID,
	)
}

// ListCategories returns paginated categories.
func (s *CategoryService) ListCategories(
	ctx context.Context,
	query dto.ListCategoriesQuery,
) (*dto.CategoryListResponse, error) {
	page := query.Page

	if page == 0 {
		page = 1
	}

	if page < 1 {
		return nil, apperrors.ErrInvalidPage
	}

	limit := query.Limit

	if limit == 0 {
		limit = 20
	}

	if limit < 1 || limit > 100 {
		return nil, apperrors.ErrInvalidLimit
	}

	search := strings.TrimSpace(query.Search)

	var parentID *string

	if query.ParentID != nil {
		value := strings.TrimSpace(*query.ParentID)
		parentID = &value
	}

	categories, total, err := s.categoryRepository.ListCategories(
		ctx,
		repository.CategoryListFilter{
			Status:   query.Status,
			Search:   search,
			ParentID: parentID,
			Skip:     int64(page-1) * int64(limit),
			Limit:    int64(limit),
		},
	)
	if err != nil {
		return nil, err
	}

	categoryResponses := make(
		[]dto.CategoryResponse,
		0,
		len(categories),
	)

	for _, category := range categories {
		categoryResponses = append(
			categoryResponses,
			toCategoryResponse(category),
		)
	}

	totalPages := int64(0)

	if total > 0 {
		totalPages = (total + int64(limit) - 1) / int64(limit)
	}

	return &dto.CategoryListResponse{
		Categories: categoryResponses,
		Pagination: dto.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}

// toCategoryResponse converts a category model into a response DTO.
func toCategoryResponse(
	category models.Category,
) dto.CategoryResponse {
	return dto.CategoryResponse{
		ID:          category.ID,
		Name:        category.Name,
		Slug:        category.Slug,
		Description: category.Description,
		ParentID:    category.ParentID,
		Image:       category.Image,
		Status:      category.Status,
		CreatedAt:   category.CreatedAt,
		UpdatedAt:   category.UpdatedAt,
	}
}

// GetCategoryTree returns the nested category hierarchy.
//
// includeInactive = true: Admin view.
// includeInactive = false: Customer view, respecting
// the effective visibility of all ancestors.
func (s *CategoryService) GetCategoryTree(
	ctx context.Context,
	includeInactive bool,
) ([]dto.CategoryTreeResponse, error) {
	categories, err := s.categoryRepository.ListAll(ctx)
	if err != nil {
		return nil, err
	}

	categoryMap := make(
		map[bson.ObjectID]models.Category,
		len(categories),
	)

	childrenMap := make(
		map[bson.ObjectID][]models.Category,
	)

	for _, category := range categories {
		categoryMap[category.ID] = category
	}

	for _, category := range categories {
		if category.ParentID != nil {
			childrenMap[*category.ParentID] = append(
				childrenMap[*category.ParentID],
				category,
			)
		}
	}

	// Determine effective visibility by checking ancestors.
	effectiveStatus := make(map[bson.ObjectID]bool)

	var isEffectivelyActive func(
		bson.ObjectID,
		map[bson.ObjectID]bool,
	) bool

	isEffectivelyActive = func(
		id bson.ObjectID,
		visited map[bson.ObjectID]bool,
	) bool {
		if value, exists := effectiveStatus[id]; exists {
			return value
		}

		if visited[id] {
			return false
		}

		category, exists := categoryMap[id]
		if !exists {
			return false
		}

		if !category.Status {
			effectiveStatus[id] = false
			return false
		}

		visited[id] = true

		if category.ParentID != nil {
			if !isEffectivelyActive(
				*category.ParentID,
				visited,
			) {
				effectiveStatus[id] = false
				return false
			}
		}

		delete(visited, id)

		effectiveStatus[id] = true
		return true
	}

	var buildTree func(
		models.Category,
		map[bson.ObjectID]bool,
	) *dto.CategoryTreeResponse

	buildTree = func(
		category models.Category,
		visited map[bson.ObjectID]bool,
	) *dto.CategoryTreeResponse {
		if visited[category.ID] {
			return nil
		}

		visited[category.ID] = true

		if !includeInactive &&
			!isEffectivelyActive(
				category.ID,
				make(map[bson.ObjectID]bool),
			) {
			return nil
		}

		node := &dto.CategoryTreeResponse{
			ID:          category.ID,
			Name:        category.Name,
			Slug:        category.Slug,
			Description: category.Description,
			ParentID:    category.ParentID,
			Image:       category.Image,
			Status:      category.Status,
			CreatedAt:   category.CreatedAt,
			UpdatedAt:   category.UpdatedAt,
			Children:    make([]dto.CategoryTreeResponse, 0),
		}

		for _, child := range childrenMap[category.ID] {
			childNode := buildTree(child, visited)

			if childNode != nil {
				node.Children = append(
					node.Children,
					*childNode,
				)
			}
		}

		delete(visited, category.ID)

		return node
	}

	tree := make(
		[]dto.CategoryTreeResponse,
		0,
	)

	for _, category := range categories {
		if category.ParentID != nil {
			continue
		}

		node := buildTree(
			category,
			make(map[bson.ObjectID]bool),
		)

		if node != nil {
			tree = append(tree, *node)
		}
	}

	return tree, nil
}

func (s *CategoryService) validateActiveAncestors(
	ctx context.Context,
	parent *models.Category,
) error {
	current := parent
	visited := make(map[bson.ObjectID]bool)

	for current != nil {
		if visited[current.ID] {
			return apperrors.ErrCategoryCircularParent
		}

		visited[current.ID] = true

		if !current.Status {
			return apperrors.ErrCategoryInactiveParent
		}

		if current.ParentID == nil {
			break
		}

		next, err := s.categoryRepository.FindByID(
			ctx,
			current.ParentID.Hex(),
		)
		if err != nil {
			if errors.Is(err, apperrors.ErrCategoryNotFound) {
				return apperrors.ErrInvalidCategoryParent
			}
			return err
		}

		current = next
	}

	return nil
}
