package sanitizer

import (
	"regexp"

	"github.com/microcosm-cc/bluemonday"
)

var policy = bluemonday.NewPolicy()

// Regular expression that strictly validates safe hex color codes
var hexColorRegex = regexp.MustCompile(`(?i)^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$`)

// Safe class name regex (e.g., allows custom styling classes like "highlight", "text-muted", "badge-primary")
// Restricts to standard alphanumeric characters, hyphens, and underscores.
var safeClassRegex = regexp.MustCompile(`^[a-zA-Z0-9-_]+(\s+[a-zA-Z0-9-_]+)*$`)

func init() {
	policy.AllowElements(
		"p",
		"br",
		"strong",
		"em",
		"span",
		"h1",
		"h2",
		"h3",
		"ul",
		"ol",
		"li",
		"blockquote",
		"a",
		"img",
	)

	// Links
	policy.RequireParseableURLs(true) // Crucial! Enforces URL validation
	policy.AllowAttrs("href").OnElements("a")

	//policy.AllowStandardURLs()

	//only allow from https urls
	policy.AllowURLSchemes("https")

	policy.RequireNoFollowOnLinks(true) // Optional: Prevents SEO spam abuse
	//policy.RequireNoReferrerOnLinks(true) // Optional: Protects user privacy

	// Images
	policy.AllowAttrs(
		"src",
		"alt",
		"width",
		"height",
	).OnElements("img")

	// ==========================================
	// SECURELY ALLOWING CLASSES
	// ==========================================
	policy.AllowAttrs("class").
		Matching(safeClassRegex).
		OnElements("p", "span", "h1", "h2", "h3", "blockquote")

	// Inline styles
	policy.AllowAttrs("style").OnElements(
		"p",
		"h1",
		"h2",
		"h3",
		"img",
		"span",
	)

	// Text alignment
	policy.AllowStyles("text-align").
		MatchingEnum("left", "right", "center", "justify").
		OnElements("p", "h1", "h2", "h3", "span")

	// Image positioning
	policy.AllowStyles("float").
		MatchingEnum("left", "right", "none").
		OnElements("img")

	// Text Color & Background Color (NEW)
	policy.AllowStyles("color").
		Matching(hexColorRegex).
		OnElements("p", "h1", "h2", "h3", "span")

	policy.AllowStyles("background-color").
		Matching(hexColorRegex).
		OnElements("p", "h1", "h2", "h3", "span")

}

func Sanitize(input string) string {
	return policy.Sanitize(input)
}
