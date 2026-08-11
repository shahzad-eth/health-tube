import {Router} from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logOutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// secured routes
router.route("/logout").post(verifyJWT, logOutUser);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/me").post(verifyJWT, getCurrentUser);

router.route("/c/:username").post(verifyJWT, getUserChannelProfile);

router.route("/update-account").put(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .put(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/update-cover-image")
  .put(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/watch-history").put(verifyJWT, getUserWatchHistory);

export default router;
