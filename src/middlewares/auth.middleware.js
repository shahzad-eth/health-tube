import {asyncHandler} from "../utlils/async-handler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utlils/api-error.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const {accessToken} =
    req.body || req.header("Authorization")?.replace("Bearer ", "");

  try {
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      console.log("Middleware : Invalid token, User not found");
      throw new ApiError(401, "Invalid token");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token");
  }
});
