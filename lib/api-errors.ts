export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ApiErrors = {
  UNAUTHORIZED: () => new ApiError(401, "Unauthorized", "UNAUTHORIZED"),
  FORBIDDEN: () => new ApiError(403, "Forbidden", "FORBIDDEN"),
  NOT_FOUND: (resource: string) => new ApiError(404, `${resource} not found`, "NOT_FOUND"),
  INVALID_REQUEST: (message: string) => new ApiError(400, message, "INVALID_REQUEST"),
  UNPROCESSABLE: (message: string) => new ApiError(422, message, "UNPROCESSABLE"),
  RATE_LIMITED: () => new ApiError(429, "Too many requests", "RATE_LIMITED"),
  INTERNAL_SERVER_ERROR: (message?: string) => new ApiError(500, message || "Internal server error", "INTERNAL_SERVER_ERROR"),
};
