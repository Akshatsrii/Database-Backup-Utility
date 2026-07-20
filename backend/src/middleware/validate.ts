import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error:   "Validation failed",
        details: (result.error as any).errors.map((e: any) => ({
          field:   e.path.join("."),
          message: e.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
}