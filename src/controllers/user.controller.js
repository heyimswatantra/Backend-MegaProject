import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// defining options to be passed in .cookie()
const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const {fullName, email, username, password} = req.body

    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "" || field == undefined)
    ) {
        throw new ApiError(400, "All fields required")
    }

    const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log("files", req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path || "";
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";

    let avatar, coverImage;
    if (avatarLocalPath || coverImageLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar) {
            throw new ApiError(400, "Error while uploading Avatar file.")
        } else if (!coverImage) {
            throw new ApiError(400, "Error while uploading Cover Image file.")
        }
    }

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    const createUser = await User.findById(user._id)
    .select("-password -refreshToken")

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User register successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    /*
    req.body se data le aao
    username OR email ka access lo
    check in DB if user exists
    perform password check
    generate access and refresh token
    send cookies
    */

    const {username, password, email} = req.body
    // console.log(req.body);
    
    if(!(username || email)) {
        throw new ApiError(400, "Username or Email is required")
    }

    // finding a user with username or email
    // we can use "$or" operator if we want to query on multiple objects
    // "$or" is a mongo operator, it takes an arr objects
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exists")
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password")
    }

    // access and refresh token banao
    // console.log(user);
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // error: .select is not a method
    // const logginedUser = user.select("-password -refreshToken")

    const logginedUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: logginedUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler (async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )
})

// regenerating access token for user login
const refreshAccessToken = asyncHandler( async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while refreshing access token")
    }

})

const changePassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password Changed Successfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current User fetched successfully")
    )
})

const updateAccountDetails = asyncHandler (async (req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details uploaded successfully") 
    )
})

const updateUserAvatar = asyncHandler (async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler (async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler (async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            // ye op ek document(record) laake dega
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // ye cnt of subscribers laake dega
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        {
            // ye no. of channel subscribed by user laake dega
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                subscribersCount: 1,
                username: 1,
                channelsSubscribedTo: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                // createdAt: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler (async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fetched Successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}