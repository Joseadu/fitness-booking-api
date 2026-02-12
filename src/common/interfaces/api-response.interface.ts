/**
 * Standard API Response Wrapper
 * Use this for all API responses to maintain consistency
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

/**
 * Helper function to create success responses
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
        success: true,
        data,
        message
    };
}

/**
 * Helper function to create error responses
 */
export function errorResponse(error: string, message?: string): ApiResponse {
    return {
        success: false,
        error,
        message
    };
}
