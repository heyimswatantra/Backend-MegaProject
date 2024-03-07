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
    
    try {
        const like = await Like.findOne({video: videoId})
    
        console.log(like);
        if (!like) {
            const newLike = await Like.create(credentials)
            if (!newLike) {
                throw new ApiError(500, "error while liking video")
            }
    
            return res
            .status(200)
            .json(
                new ApiResponse(200, newLike, "Video liked successfully")
            )
        } else {
            const unLike = await Like.deleteOne(credentials)
            if (!unLike) {
                throw new ApiError(500, "Error while unliking video")
            }
    
            return res
            .status(200)
            .json(
                new ApiResponse(200, unLike, "Video unliked successfully")
            )
        }
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong while toggling video like")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const userId = req.user?._id

    const credentials = {
        likedBy: userId,
        comment: commentId
    }

    if(!commentId) {
        throw new ApiError(500, "Comment Id is required")
    }
    
    const like = await Like.findOne({comment: commentId})

    if (!like) {
        const newLike = await Like.create(credentials)
        if (!newLike) {
            throw new ApiError(500, "Something went wrong while liking comment")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, newLike, "Comment liked successfully")
        )
    } else {
        const unLike = await Like.deleteOne(credentials)
        if (!unLike) {
            throw new ApiError(500, "Error while unliking comment")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, unLike, "Comment unliked successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    
    const userId = req.user?._id

    const credentials = {
        likedBy: userId,
        tweet: tweetId
    }

    if(!tweetId) {
        throw new ApiError(500, "Tweet Id is required")
    }
    
    const like = await Like.findOne({tweet: tweetId})

    if (!like) {
        const newLike = await Like.create(credentials)
        if (!newLike) {
            throw new ApiError(500, "Something went wrong while liking tweet")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, newLike, "Tweet liked successfully")
        )
    } else {
        const unLike = await Like.deleteOne(credentials)
        if (!unLike) {
            throw new ApiError(500, "Error while unliking tweet")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, unLike, "Tweet unliked successfully")
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "User id is required")
    }

    try {
        const allLikedVideos = await Like.find(
            {
                likedBy: userId,
                // only fetch documents that have a video property
                video: { $exists: true}
            }
        ).select("video")

        if (!allLikedVideos) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while fetching liked videos from DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, allLikedVideos, "fetched successfully"))
    } catch (error) {
        throw new ApiError(400, error?.message ||"Something went wrong while fetching liked videos")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}