import DOMPurify from "dompurify";

const allowedTags = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "strong",
  "em",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
  "code",
  "pre",
  "span", 
  "img",
];

const allowedAttributes = [
  "href",
  "target",
  "rel",
  "src",   
  "alt",  
  "width",
  "height",
  "class", 
  "style", 
];

export function sanitizeHtml(html: string) {
  if (!html) {
    return "";
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,

    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    
    // ALLOWED_URI_REGEXP:
    //   /^(?:https:|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i, //Don't allow Http. Only Https 

    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "svg",
      "math",
    ],

    FORBID_ATTR: [
      "onerror",
      "onclick",
      "onload",
      "onmouseover",
      "onfocus",
      "onmouseenter",
      "onmouseleave",
    ],
  });
}