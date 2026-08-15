import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import {format} from "path";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  } finally{
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted from cloudinary. Public id :", publicId);
  } catch (error) {
    console.log("Error deleting from Cloudinary ", error);
  }
};

const getVideoThumbnail = (publicId) => {
  try {
    const thumbnail = cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        {start_offset: "auto"},
        {width: 720, crop: "scale"},
        {quality: "auto", fetch_format: "auto"},
      ],
    });
  
    return thumbnail;
  } catch (error) {
    console.log("Error getting thumbnail :", error)
    throw error;
  }
};

export {uploadOnCloudinary, deleteFromCloudinary, getVideoThumbnail};
