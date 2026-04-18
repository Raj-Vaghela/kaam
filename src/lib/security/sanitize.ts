const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
};

const HTML_ESCAPE_RE = /[&<>"']/g;

/**
 * Escapes HTML special characters to prevent XSS in email templates
 * and other HTML contexts.
 */
export function escapeHtml(str: string): string {
    if (!str) return "";
    return str.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Validates that a URL is safe to use in an href attribute.
 * Only allows https:// URLs and relative paths starting with /.
 */
export function safeHref(url: string): string {
    if (!url) return "#";
    const trimmed = url.trim();
    if (trimmed.startsWith("https://") || trimmed.startsWith("/")) return trimmed;
    return "#";
}
