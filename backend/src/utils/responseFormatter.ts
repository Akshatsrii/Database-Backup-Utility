export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const successResponse = <T>(res: any, data: T, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res: any, error: string, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};
