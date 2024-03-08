import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // get userid
    // validate userid
    // checkif user exists
    // find all the video by user
    // calc no of views and total videos
    // lookup for likes
    // lookup for subs

    const userId  = req.user?._id
    // console.log(req.user._id, userId);

    try {
        const stats = await Video.aggregate(
            [
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $lookup: {
                        from: "likes",
                        localField: "_id",
                        foreignField: "video",
                        as: "Likes"
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "owner",
                        foreignField: "channel",
                        as: "Subscribers"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalVideos: { $sum: 1 },
                        totalViews: { $sum: "$views" },
                        totalLikes: { $first: { $size: "$Likes"}},
                        totalSubscribers: { $first: { $size: "$Subscribers" }}
                    }
                },
                {
                    $project:{
                              _id:0,
                              totalSubscribers:1,
                              totalLikes:1,
                              totalVideos:1,
                              totalViews:1   
                             }
                  }
            ]
        )
    
        console.log(stats);

        if (!stats) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Could not fetch channel stats"))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, stats[0], "Channel Stats fetched successfully"))
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while getting channel stats")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // get userid
    // validate userid
    // checkif user exists
    // find all the video by user

    const userId  = req.user?._id

    try {
        const channelVideos = await Video.aggregate(
            [
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(userId)
                    }
                },
                
            ]
        )

        // console.log(channelVideos);

        if (!channelVideos) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Could not fetch channel stats"))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, channelVideos, "Channel Stats fetched successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while getting channel videos")
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }