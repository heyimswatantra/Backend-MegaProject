import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user?._id
    const credentials = {
        likedBy: userId,
        video: videoId
    }
    if(!videoId) {
        throw new ApiError(500, "videoId is required")
    }
    
    const like = await Like.find({video: videoId})

    if (!like) {
        const newLike = await Like.create(credentials)
        if (!newLike) {
            throw new ApiError(500, "error while liking")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, newLike, "Liked successfully")
        )
    } else {
        const unLike = await Like.deleteOne(credentials)
        if (!unLike) {
            throw new ApiError(500, "Error while unliking")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, unLike, "Unliked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}