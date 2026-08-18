import mongoose, {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const {name, description} = req.body;
  const loggedInUser = req.user?._id;

  const playlist = await Playlist.create({
    title: name,
    description: description,
    owner: new mongoose.Types.ObjectId(loggedInUser),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const {userId} = req.params;

  if (!isValidObjectId(userId)) {
    console.log("Invalid user Id");
    throw new ApiError(400, "Invalid user Id");
  }

  const [user, playlists] = await Promise.all([
    User.findById(userId).select("username fullName avatar"),
    Playlists.find({owner: userId}),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {user, playlists}, "Playlist fetched successfully"),
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.params;
  const loggedInUser = req.user?._id;

  if(!isValidObjectId(playlistId)){
    console.log("Invalid playlist Id")
    throw new ApiError(400,"Invalid playlist Id")
  }

  if(!isValidObjectId(videoId)){
    console.log("Invalid video Id")
    throw new ApiError(400,"Invalid video Id")
  }

  const playlist = await Playlist.findById(playlistId)

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    {
      _id:playlistId,
      owner:loggedInUser
    },
    {
      $pull:{videos:videoId}
    },
    {returnDocument:"after"}
  )
  
  if(!updatePlaylist){
    const existingPlaylist = await Playlist.exists({_id:playlistId})
    if(!existingPlaylist){
      console.log("Playlist not found");
      throw new ApiError(404,"Playlist not found")
    }
    throw new ApiError(403,"Access Denied")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,updatePlaylist,"Video removed from playlist")
  )
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const {playlistId} = req.params;
  const {name, description} = req.body;
  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
