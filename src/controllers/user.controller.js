import {asyncHandler} from "../utlils/async-handler.js";
import {User} from "../models/user.model.js";
import {ApiResponse} from "../utlils/api-response.js";
import {ApiError} from "../utlils/api-error.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utlils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("User doesn't exists with id :", userId);
      return res.status(200).json(new ApiError(404, "User doesn't exists"));
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(500, "Something went wron while generating JWT tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const {fullName, username, email, password} = req.body;

  // validation middleware to be added later
  if (!fullName || !username || !email || !password) {
    console.log("All fields are required");
    throw new ApiError(400, "All fields are required");
  }

  const isUser = await User.findOne({
    $or: [{username}, {email}],
  });

  if (isUser) {
    console.log("User already exists");
    throw new ApiError(409, "User already exists with email or username");
  }

  console.warn(req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    console.log("Avatar file is missing");
    throw new ApiError(404, "Avatar file is missing");
  }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("File uploaded successfully", avatar);
  } catch (error) {
    console.log("Error uploading avatar", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  let coverImage;
  if (coverImageLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      console.log("File uploaded successfully", coverImage);
    } catch (error) {
      console.log("Error uploading coverImage", error);
      throw new ApiError(500, "Failed to upload coverImage");
    }
  }

  try {
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!createdUser) {
      console.log("Somthing went wrong while creating the user");
      throw new ApiError(500, "Somthing went wrong while creating the user");
    }

    return res
      .status(200)
      .json(new ApiResponse(201, createdUser, "User registered succesfully"));
  } catch (error) {
    console.log("User creation failed");

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }

    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "Somthing went wrong while creating the user and images were deleted.",
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const {username, email, password} = req.body;

  if (!email || !password) {
    console.log("All fields are required");
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{email}, {username}],
  });

  if (!user) {
    console.log("User doesn't exists");
    throw new ApiError(404, "User doesn't exists");
  }

  const correctPassword = await user.isPasswordCorrect(password);

  if (!correctPassword) {
    console.log("Password id invalid");
    throw new ApiError(400, "Password id invalid");
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {loggedInUser, accessToken, refreshToken},
        "Login successful",
      ),
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $set: {refreshToken: ""},
    },
    {returnDocument: "after"},
  );
  return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const {incomingRefreshToken} = req.body.refreshToken;

  if (!incomingRefreshToken) {
    console.log("Refresh token is missing");
    throw new ApiError(400, "Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      console.log("Invalid refresh Token");
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      console.log("Invalid refresh Token");
      throw new ApiError(401, "Invalid refresh Token");
    }

    const {accessToken, refreshToken: newRefreshToken} =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({validateBeforeSave: false});

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {accessToken, refreshToken: newRefreshToken},
          "New refresh token generated successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(500, "Something went wron while generating JWT tokens");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {newPassword, password} = req.body;

  if (!newPassword || !password) {
    console.log("Password Cannot be empty");
    throw new ApiError(400, "New and old both passwords are required");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    console.log("User doesn't exists");
    throw new ApiError(404, "User doesn't exists");
  }

  const correctPassword = user.isPasswordCorrect(password);

  if (!correctPassword) {
    console.log("Old Password is incorrect");
    throw new ApiError(401, "Old Password is incorrect");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successful"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user details"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const {fullName, email} = req.body;

  if (!fullName || !email) {
    console.log("Full name and email both are required");
    throw new ApiError(400, "Full name and email both are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path;

  if (!avatarLocalPath) {
    console.log("Avatar file is missing");
    throw new ApiError(404, "Avatar file is missing");
  }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Avatar updated");
  } catch (error) {
    throw new ApiError(500, "Error uploading the file. ", error);
  }

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      avatar: avatar?.url,
    },
    {returnDocument: "after"},
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;

  if (!coverImageLocalPath) {
    console.log("Image is required");
    throw new ApiError(400, "Image is required");
  }

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("Image upload successful");
  } catch (error) {
    throw new ApiError(500, "Error uploading the file. ", error);
  }

  if (!coverImage) {
    throw new ApiError(500, "Error while uploading the image. ", error);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image update successful"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params;

  if (!username) {
    console.log("Username is required");
    throw new ApiError(200, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subcribedChannelCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user._id, "$subscribers.subscriber"]},
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subcribedChannelCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    console.log("Channel not found");
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched successfully"),
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
      },
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
          },
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                fullName: 1,
              },
            },
          ],
        },
        {
          $addFields: {
            owner: {
              $arrayElemAt: ["$owner", 0],
            },
          },
        },
      ],
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch history fetched successfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logOutUser,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
