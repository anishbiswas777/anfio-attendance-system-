import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSafeErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      return "A record with these details already exists.";
    }
    if (msg.includes("foreign key")) {
      return "Referenced record was not found or cannot be modified.";
    }
    if (msg.includes("permission denied") || msg.includes("row-level security")) {
      return "You do not have permission to perform this action.";
    }
    return fallback;
  }
  return fallback;
}
