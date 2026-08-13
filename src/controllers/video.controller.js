import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const {title, description} = req.body;
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const {videoId} = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const {videoId} = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfull"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  const loggedInUser = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  if (!isValidObjectId(loggedInUser)) {
    throw new ApiError(401, "Access Denied");
  }

  const video = await Video.findOne({
    _id: new mongoose.Types.ObjectId(videoId),
    owner: new mongoose.Types.ObjectId(loggedInUser),
  });

  if (!video) {
    throw new ApiError(404, "Video not found or you do not have permission");
  }

  video.ispublished = !video.ispublished;

  await video.save({validateBeforeSave: false});

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {ispublished: video.ispublished},
        video.ispublished
          ? "Video published Successfully"
          : "Video is now private",
      ),
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
