import {asyncHandler} from "../utlils/async-handler.js";
import {User} from "../models/user.model.js";
import {ApiResponse} from "../utlils/api-response.js";
import {ApiError} from "../utlils/api-error.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utlils/cloudinary.js";

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
    console.log("User creation failed")
    
    if(avatar){
        await deleteFromCloudinary(avatar.public_id)
    }

    if(coverImage){
        await deleteFromCloudinary(coverImage.public_id)
    }

    throw new ApiError(500, "Somthing went wrong while creating the user and images were deleted.");
  }
});

export {registerUser};
