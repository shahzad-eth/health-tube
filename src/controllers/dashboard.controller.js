import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const {channelId} = req.params;
  const loggedInUser = req.user?._id;

  if (!isValidObjectId(channelId)) {
    console.log("Channel not found");
    throw new ApiError(400, "Channel not found");
  }

  if (loggedInUser.toString() !== channelId.toString()) {
    console.log("Access Denied");
    throw new ApiError(403, "Access Denied");
  }

  const videos = await Video.find({
    owner: channelId,
  });

  if (!videos.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No videos found for this channel"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export {getChannelStats, getChannelVideos};
