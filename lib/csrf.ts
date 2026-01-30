/**
 * CSRF Token Utilities - Re-exports for backward compatibility
 * Use csrf-utils.ts for browser-compatible token generation
 * Use csrf-server.ts for server-side cookie operations
 */

// Re-export the browser-safe function for client components
export { generateCsrfToken } from "./csrf-utils";
