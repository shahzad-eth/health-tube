import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { getVideoThumbnail } from "../utlils/cloudinary.js";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const {title, description} = req.body;
  // TODO: get video, upload to cloudinary, create video
  const loggedInUser = req.user?._id;
  
  if(!title || !description){
    if(req.file?.path) fs.unlinkSync(req.file.path)
      throw new ApiError(400, "Title and description are required")
  }

  const videoLocalPath = req.file?.path;

  if(!videoLocalPath){
    console.log("Video file is missing")
    throw new ApiError(404, "Video file is missing")
  }

  let uploadedVideo;
   try {
    uploadedVideo = await uploadOnCloudinary(videoLocalPath)
    console.log("Video uploaded")
   } catch (error) {
    throw new ApiError(400,"Error while uploading the file ", error)
   }

   if(!uploadedVideo){
    throw new ApiError(400,"Error while uploading the file ")
   }

   const thumbnail = getVideoThumbnail(uploadedVideo.public_id)

   const video = await Video.create({
    videoFile: uploadedVideo?.secure_url,
    thumbnail,
    owner: new mongoose.Types.ObjectId(loggedInUser),
    title,
    description,
    duration:uploadedVideo.duration
   })

   return res
   .status(200)
   .json(
    new ApiResponse(200, video, "Video uploaded successfully")
   )
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
