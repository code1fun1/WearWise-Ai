import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Used by all ShadCN-style components.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
