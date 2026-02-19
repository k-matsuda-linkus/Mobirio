export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mobirio.jp";
  return email === adminEmail;
}
