import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import {Subscription} from "../models/subscription.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createSubscription = asyncHandler(async (req, res) => {
  const {channelId} = req.params;
  const subscriberId = req.user?._id;

  if (!isValidObjectId(channelId)) {
    console.log("Channel Id is not valid");
    throw new ApiError(400, "Channel Id is not valid");
  }

  const subscription = await Subscription.findOneAndUpdate(
    {
      subscriber: subscriberId,
      channel: channelId,
    },
    {
      $setOnInsert: {
        subscriber: subscriberId,
        channel: channelId,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      includeResultMetadata: true,
    },
  );

  const isNewSubscription = !subscription.lastErrorObject.updatedExisting;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {isSubscribed: true},
        isNewSubscription
          ? "Subscribed to the channel successfully"
          : "Already subscribed to the channel",
      ),
    );
});

const deleteSubscription = asyncHandler(async (req, res) => {
  const {channelId} = req.params;
  const subscriberId = req.user?._id;

  if (!isValidObjectId(channelId)) {
    console.log("Channel Id is not valid");
    throw new ApiError(400, "Channel Id is not valid");
  }

  await Subscription.findOneAndDelete({
    subscriber: subscriberId,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Unsubscribed to the channel"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const {channelId} = req.params;
  const loggedInUser = req.user?._id;

  if (!isValidObjectId(channelId)) {
    console.log("Channel Id is not valid");
    throw new ApiError(400, "Channel Id is not valid");
  }

  if (loggedInUser.toString() !== channelId.toString()) {
    console.log("Access Denied");
    throw new ApiError(403, "Access Denied");
  }

  const subscribersList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $addFields:{
        channelCount:{
          $size:"$subscriber"
        }
      }
    }
  ]);

  if (!subscribersList.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscribers yet."));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribersList,
        "Subscribers list fetched successfully",
      ),
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const {subscriberId} = req.params;
  const loggedInUser = req.user?._id;

  if (!isValidObjectId(subscriberId)) {
    console.log("User Id is not valid");
    throw new ApiError(400, "User Id is not valid");
  }

  if (subscriberId.toString() !== loggedInUser.toString()) {
    console.log("Access Denied");
    throw new ApiError(403, "Access Denied");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $addFields:{
        channelCount:{
          $size:"$channel"
        }
      }
    }
  ]);

  if (!channels.length) {
    return res.status(200).json(new ApiResponse(200, [], "No subscription yet!"));
  
    return res
      .status(200)
      .json(new ApiResponse(200, channels, "Subscriptions fetched successfully"));
  }
});


export {createSubscription,deleteSubscription, getUserChannelSubscribers, getSubscribedChannels};
