import {ApiError} from "../utlils/api-error";
import mongoose from "mongoose";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose ? 400 : 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.ENVIRONMENT === "development" ? {stack: error.stack} : {}),
  };

  return res.status(error.statusCode).json(response);
};

export {errorHandler};
