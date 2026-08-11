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
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const {subscriberId} = req.params;
});

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels};
