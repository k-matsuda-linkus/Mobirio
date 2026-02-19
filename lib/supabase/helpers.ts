import type { Tables } from "@/types/database";

export type UserRole = "customer" | "vendor" | "admin";

export function hasRole(userRole: UserRole | null, requiredRole: UserRole | UserRole[]): boolean {
  if (!userRole) return false;
  if (Array.isArray(requiredRole)) return requiredRole.includes(userRole);
  if (userRole === "admin") return true;
  if (userRole === "vendor" && requiredRole === "customer") return true;
  return userRole === requiredRole;
}

export function isAdmin(role: UserRole | null): boolean { return role === "admin"; }
export function isVendor(role: UserRole | null): boolean { return role === "vendor" || role === "admin"; }
export function isCustomer(role: UserRole | null): boolean { return !!role; }
