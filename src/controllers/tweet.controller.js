import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const userId = req.user?._id

    if (!content) {
        throw new ApiError(500, "Tweet content is required")
    }

    try {
        const tweet = await Tweet.create({content,owner: userId})
        
        if (!tweet) {
            return res
            .status(500)
            .json(new ApiError(500, "Something went wrong while tweeting"))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"))
    
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while creating tweet", error)
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params  //req.user?._id
    
    if (!userId) {
        throw new ApiError(500, "User ID is required")
    }

    try {
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $project: {
                    content: 1,
                    _id: 0
                }
            }
        ])
    
        if (!tweets || tweets.length == 0) {
            return res
            .status(404)
            .json(new ApiResponse(404, {}, "No tweets found for this user"))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching user tweets")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    // console.log(content);

    if (!tweetId) {
        throw new ApiError(500, "Tweet ID is required")
    }

    try {
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {content},
            {new: true}
        )

        if (!updateTweet) {
            return res
            .status(400)
            .json(new ApiError(400, "Cannot update tweet"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while updating tweets")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!tweetId) {
        throw new ApiError(500, "Tweet ID is required")
    }

    try {
        const updatedTweet = await Tweet.findByIdAndDelete(tweetId)

        if (!updateTweet) {
            return res
            .status(400)
            .json(new ApiError(400, "Cannot Delete tweet"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet Deleted successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while deleting tweets")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
