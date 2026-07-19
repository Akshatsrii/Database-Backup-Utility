import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/responseFormatter';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Skeleton implementation
    if (email === 'admin@backupos.com' && password === 'admin') {
      return successResponse(res, { token: 'mock-jwt-token' }, 'Login successful');
    }
    return errorResponse(res, 'Invalid credentials', 401);
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    return successResponse(res, { user: { email: 'admin@backupos.com', role: 'admin' } }, 'User fetched');
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};
