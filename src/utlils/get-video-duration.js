import {getVideoDurationInSeconds} from "get-video-duration";

const getVideoDuration = (videoLocalPath) => {
  const videoDuration = getVideoDurationInSeconds(videoLocalPath);

  return videoDuration;
};

export {getVideoDuration}