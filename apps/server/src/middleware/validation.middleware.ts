import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod'; // Import the Zod schema type
import HttpStatusCodes from '../constants/HttpStatusCodes';

export function validationMiddleware(schema: z.Schema): RequestHandler {
  // Return an async middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    
    // Use safeParseAsync to validate. This is non-blocking
    // and handles both sync and async schemas.
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      // Extract the Zod issues
      const issues = result.error.issues;
      
      // Format a user-friendly message, including the field path
      const message = issues
        .map((issue) => `${issue.path.join('.') || 'error'}: ${issue.message}`)
        .join(', ');

      // Send the 400 response
      return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: issues, message });
    }

    // IMPORTANT: Replace req.body with the validated (and transformed) data
    // This ensures your controllers get cleaned, typed, and transformed data.
    req.body = result.data;
    
    next();
  };
}