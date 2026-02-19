export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim();
}
// Note: sanitizeHtml should also escape single quotes to &#x27;
// Note: sanitizeSearchQuery should strip non-word, non-space, non-CJK characters
