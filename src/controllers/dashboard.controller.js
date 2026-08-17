import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const loggedInUser = req.user?._id;

  if (!loggedInUser) {
    console.log("Unauthorized, please login");
    throw new ApiError(401, "Unauthorized, please login");
  }

  const totalVideoViews = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(loggedInUser),
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$views",
        },
      },
    },
  ]);

  const totalSubscribers = Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(loggedInUser),
      },
    },
    {
      $count: "totalSubscribers",
    },
  ]);

  const totalVideos = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(loggedInUser),
      },
    },
    {
      $count: "totalVideos",
    },
  ]);

  const totalLikes = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(loggedInUser),
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        pipeline: [
          {
            $group: {
              _id: null,
              totalLikesForChannel: {
                $sum: {
                  $size: {
                    $ifNull: ["$likedBy", []],
                  },
                },
              },
            },
          },
        ],
        as: "likes",
      },
    },
    {
      $unwind: "$likes",
    },
    {
      $project: {
        _id: 0,
        totalLikesForChannel: {
          $ifNull: ["$likes.totalLikesForChannel", 0],
        },
      },
    },
  ]);
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
