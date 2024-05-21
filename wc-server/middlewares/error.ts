import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(err.statusCode).json({
    msg: err.message,
  });

  next(err);
};
