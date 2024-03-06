import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "ChannelId is Required")
    }
    const userId = req.user?._id;
    // create a obj to be used to search in DB 
    const credentials = {
        subscriber: userId,
        channel: channelId
    }

    console.log(credentials);
    try {
        const subscribed = await Subscription.findOne(credentials)
        // if not subscribed, (no such doc exists in DB)
        if (!subscribed) {
            // create new doc in DB
            const newSubscriber = await Subscription.create(credentials)
            if (!newSubscriber) {
                throw new ApiError(500, "Error while subscribing")
            }
            return res
            .status(200)
            .json(
                new ApiResponse(200, newSubscriber, "Subscribed Successfully")
            )
        } else {
            // if already subscribed, just del the record from DB
            const deleteSub = await Subscription.deleteOne(credentials)
            if (!deleteSub) {
                throw new ApiError(500, "Error while Unsubscribing")
            }
            return res
            .status(200)
            .json(
                new ApiResponse(200, deleteSub, "Unsubscribed Successfully")
            )
        }
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while toggleSubscriber", error)
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if (!subscriberId) {
        throw new ApiError(400, "Channel Id required")
    }

    try {
        const subscriberList = await Subscription.aggregate([
            {
                // first find all the docs containing the channelId
                $match: {
                    channel: subscriberId
                }
            },
            {
                // group all the docs to have a count of subs
                $group: {
                    _id: "channel",
                    noOfSubscribers: {
                        // "push" return an array of specified expression
                        $push: "$subscribers" // <- expression
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    noOfSubscribers: 1,
                }
            }
        ])
    
        if (!subscriberList || subscriberList.length === 0) {
            return res
            .status(201)
            .json(
                new ApiResponse(201, [], "No subscribers found for Channel")
            )
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, subscriberList, "Subscriber count fetch successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Unable to get Subscriber count")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // console.log(req.params," from 107");
    const {  channelId } = req.params

    if (!channelId) {
        throw new ApiError(400, "Subscriber Id required")
    }

    try {
        const channelList = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $group: {
                    _id: "subscriber",
                    listOfChannels: {
                        $push: "$channel"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    listOfChannels: 1
                }
            }
        ])
    
        // console.log(channelList);
        
        if (!channelList || channelList.length === 0) {
            return res
            .status(201)
            .json(
                new ApiResponse(201, [], "No channels subscribed by the user")
            )
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, channelList, "Channel List fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Unable to get channel list", error)
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}