export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequest extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class Unauthorized extends CustomError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class Forbidden extends CustomError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFound extends CustomError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string) {
    super(message, 500);
  }
}
