import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "🛒", color: "#4CAF50" },
  { name: "Rent", icon: "🏠", color: "#2196F3" },
  { name: "Utilities", icon: "💡", color: "#FF9800" },
  { name: "Entertainment", icon: "🎬", color: "#9C27B0" },
  { name: "Dining", icon: "🍽️", color: "#F44336" },
  { name: "Transport", icon: "🚗", color: "#00BCD4" },
  { name: "Savings", icon: "💰", color: "#8BC34A" },
  { name: "Healthcare", icon: "🏥", color: "#E91E63" },
  { name: "Shopping", icon: "🛍️", color: "#FF5722" },
  { name: "Other", icon: "📦", color: "#607D8B" },
];
