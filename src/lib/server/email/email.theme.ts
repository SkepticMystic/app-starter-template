/**
 * The email design tokens. Every style is inline: Svelte extracts a component's `<style>`
 * rather than rendering it, and most clients drop `<style>` anyway. The one exception is
 * {@link EMAIL_HEAD_CSS}, which only *improves* a client that reads it.
 *
 * The `email-*` classes on elements exist for that sheet's dark-mode overrides, so an element
 * whose colour should flip carries both the inline colour and the class.
 */
export const EMAIL_COLOR = {
  page: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  ink: "#0f172a",
  muted: "#64748b",
  /** `--primary` in `layout.css`, and the brand script's default accent. */
  accent: "#6468f0",
  danger: "#dc2626",
  on_accent: "#ffffff",
  subtle: "#f1f5f9",
  warning_bg: "#fffbeb",
  warning_border: "#f59e0b",
  warning_ink: "#78350f",
} as const;

const C = EMAIL_COLOR;

export const EMAIL_FONT = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
} as const;

/** Inline styles the templates repeat. */
export const EMAIL_STYLE = {
  h1: `margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;color:${C.ink};`,
  p: "margin:0 0 16px;",
  small: `margin:0 0 16px;font-size:14px;line-height:1.5;color:${C.muted};`,
  link: `color:${C.accent};text-decoration:underline;`,
} as const;

/** Read by Apple Mail, iOS, Outlook.com and the Gmail apps; ignored elsewhere, harmlessly. */
export const EMAIL_HEAD_CSS = `
body { margin: 0; padding: 0; width: 100% !important; }
img { border: 0; outline: none; text-decoration: none; }
@media (max-width: 620px) {
  .email-card { padding: 24px 20px !important; }
}
@media (prefers-color-scheme: dark) {
  .email-page { background-color: #0b1120 !important; }
  .email-card { background-color: #111827 !important; border-color: #1f2937 !important; }
  .email-ink { color: #e5e7eb !important; }
  .email-muted { color: #9ca3af !important; }
  .email-subtle { background-color: #1f2937 !important; }
  .email-note { background-color: #292211 !important; color: #fde68a !important; }
}
`;
