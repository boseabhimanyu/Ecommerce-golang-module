package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/unrolled/secure"
)

func SecurityMiddleware() gin.HandlerFunc {
	isDev := os.Getenv("ENV") == "development" || os.Getenv("APP_ENV") == "development"

	sec := secure.New(secure.Options{
		// Prevent browsers from MIME-sniffing the content type
		ContentTypeNosniff: true,

		// Prevent clickjacking via iframes
		FrameDeny: true,

		// Filter XSS on older browsers
		BrowserXssFilter: true,

		// Referrer policy
		ReferrerPolicy: "strict-origin-when-cross-origin",

		// HTTPS / HSTS options (disabled in local dev)
		IsDevelopment:        isDev,
		SSLRedirect:          !isDev,
		STSSeconds:           31536000, // 1 year
		STSIncludeSubdomains: !isDev,
		STSPreload:           !isDev,
	})

	return func(c *gin.Context) {
		// Process sets headers and handles SSL redirects if enabled
		err := sec.Process(c.Writer, c.Request)
		if err != nil {
			// Abort the chain if secure fails (e.g., bad host or failed SSL redirect)
			c.Abort()
			return
		}

		// Continue downstream handlers
		c.Next()
	}
}
