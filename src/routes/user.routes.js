import { Router } from "express";
import { 
    changePassword, 
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken, 
    registerUser,
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
} from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verfiyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(
    verfiyJWT,
    logoutUser
)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verfiyJWT, changePassword)

router.route("/current-user").get(verfiyJWT, getCurrentUser)

router.route("/update-account").patch(verfiyJWT, updateAccountDetails)

router.route("/avatar").patch(verfiyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-Image").post(verfiyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verfiyJWT, getUserChannelProfile)

router.route("/history").get(verfiyJWT, getWatchHistory)

export default router