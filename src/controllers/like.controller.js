import mongoose, {isValidObjectId, model} from "mongoose";
import {Like} from "../models/like.model.js";
import {Comment} from "../models/comment.model.js";
import {Tweet} from "../models/tweet.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";

const toggleLike = asyncHandler(async (req, res) => {
  
  const {targetType,targetId} = req.params;
  const loggedInUser = req.user?._id;

  const VALID_TARGETS = {
    video: {model: Video, field:"video"},
    comment: {model: Comment, field:"comment"},
    tweet: {model: Tweet, field:"tweet"},
  }

  const targetConfig = VALID_TARGETS[targetType?.toLowerCase()];

  if(!targetConfig){
    console.log("Target type must be 'video', 'comment' or 'tweet' only")
    throw new ApiError(400, "Target type must be 'video', 'comment' or 'tweet' only")
  }
  
  if (!isValidObjectId(targetId)) {
    console.log(`Invalid ${targetType} Id`);
    throw new ApiError(400, `Invalid ${targetType} Id`);
  }

  const existingTarget = await targetConfig.model.findById(targetId);

  if (!existingTarget) {
    console.log(`${targetType} not found`);
    throw new ApiError(40, `${targetType} not found`);
  }

  const query = {
    [targetConfig.field]: targetId,
    likedBy: loggedInUser,
  }

  const existingDoc = await Like.findOne(query);

  if (existingDoc) {
    await Like.findByIdAndDelete(
      existingDoc._id
    );

    return res
    .status(200)
    .json(
      new ApiResponse(200,
        {isLiked : false},
        `${targetType} unliked successfully`
      )
    )
  } 
    
  const newDoc = await Like.create( query );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {newDoc, isLiked : true},
        `${targetType} liked successfully`,
      ),
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export {toggleLike, getLikedVideos};
