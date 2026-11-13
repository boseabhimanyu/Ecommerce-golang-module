package apperrors

import (
	"errors"
)

var (
	ErrEmailAlreadyExists    = errors.New("email already exists")
	ErrUsernameAlreadyExists = errors.New("username already exists")
	ErrPhoneAlreadyExists    = errors.New("phone number already exists")
	ErrEmailNotVerified      = errors.New("Email not verified")
	ErrEmailAlreadyVerified  = errors.New("Email already verified")

	// Validation errors
	ErrInvalidUserID       = errors.New("invalid user id")
	ErrInvalidPassword     = errors.New("invalid password")
	ErrInvalidUserRole     = errors.New("invalid user role")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	ErrNoFieldsToUpdate    = errors.New("no fields to update")

	// Pagination
	ErrInvalidPage  = errors.New("page must be greater than zero")
	ErrInvalidLimit = errors.New("limit must be between 1 and 100")

	// User
	ErrCannotChangeOwnStatus       = errors.New("admin cannot change their own account status")
	ErrUserNotFound                = errors.New("user not found")
	ErrRegistrationDisabled        = errors.New("user registration is currently disabled by the administrator")
	ErrApplicationSettingsNotFound = errors.New("application settings not found")
	ErrInvalidOrExpiredToken       = errors.New("Invalid or expired token")

	// RefreshToken
	ErrRefreshTokenNotFound = errors.New("refresh token not found")

	// Menu
	ErrMenuNotFound          = errors.New("menu not found")
	ErrMenuInactive          = errors.New("menu inactive")
	ErrMenuAlreadyExists     = errors.New("menu already exists")
	ErrInvalidMenuLocation   = errors.New("invalid menu location")
	ErrInvalidMenuName       = errors.New("invalid menu name")
	ErrInvalidMenuItem       = errors.New("invalid menu item")
	ErrMenuDepthExceeded     = errors.New("menu nesting depth exceeded")
	ErrMenuItemNotFound      = errors.New("menu item not found")
	ErrMenuItemOrderNotFound = errors.New("menu item order not found")

	// Pages
	ErrPageNotFound       = errors.New("page not found")
	ErrInvalidPageContent = errors.New("invalid page")
	ErrInvalidVisibility  = errors.New("invalid page visibility")
	ErrInvalidSlug        = errors.New("invalid slug")
	ErrSlugAlreadyExists  = errors.New("slug already exists")

	// TOTP/2FA
	ErrInvalidTOTPCode          = errors.New("invalid TOTP code")
	ErrTwoFactorSetupNotStarted = errors.New("two-factor setup has not been started")
	ErrTwoFactorNotEnabled      = errors.New("two-factor authentication is not enabled")
	ErrTwoFactorAlreadyEnabled  = errors.New("two-factor authentication is already enabled")
	ErrInvalidBackupCode        = errors.New("invalid backup code")
	ErrTwoFactorResetNotAllowed = errors.New("two-factor reset is not allowed for this user")
	ErrTwoFactorRequired        = errors.New("Enter 2FA or backup code")

	//Categories
	ErrCategoryNotFound       = errors.New("category not found")
	ErrInvalidCategoryID      = errors.New("invalid category id")
	ErrCategorySlugExists     = errors.New("category slug already exists")
	ErrCategoryNameRequired   = errors.New("category name is required")
	ErrInvalidCategoryName    = errors.New("invalid category name")
	ErrInvalidCategoryParent  = errors.New("invalid category parent")
	ErrCategoryHasChildren    = errors.New("category has child categories")
	ErrCategoryCircularParent = errors.New("circular category hierarchy")
	ErrCategoryInactiveParent = errors.New("parent category is inactive")
	ErrNoCategoryFields       = errors.New("no category fields to update")
	ErrInvalidCategoryStatus  = errors.New("invalid category status")
)
