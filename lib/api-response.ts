import { NextResponse } from "next/server";
import { ApiError } from "./api-errors";

type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function apiSuccess<T>(data: T, statusCode = 200) {
  return NextResponse.json(
    { success: true, data } as ApiResponse<T>, 
    { status: statusCode }
  );
}

export function apiError(error: unknown) {
  console.error("API Error caught:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message, code: "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: "Internal server error", code: "INTERNAL_SERVER_ERROR" },
    { status: 500 }
  );
}
