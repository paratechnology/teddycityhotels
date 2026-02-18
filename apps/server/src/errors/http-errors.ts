/**
 * Base class for custom HTTP errors.
 * Allows for a status code to be associated with an error.
 */
export class HttpError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // This is necessary to restore the prototype chain,
    // allowing 'instanceof' to work correctly.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Represents a 404 Not Found error.
 */
export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

/**
 * Represents a 409 Conflict error.
 * Useful for duplicate entries, etc.
 */
export class ConflictError extends HttpError {
  constructor(message = 'A conflict occurred') {
    super(409, message);
  }
}

/**
 * Represents a 400 Bad Request error.
 */
export class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

/**
 * Represents a 401 Unauthorized error.
 */
export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}


/**
* Represents a 401 Unauthorized error.
*/
export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}
