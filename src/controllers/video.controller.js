import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const userId = req.user?._id

    // get the video and thumbnail files
    // uploadon cloudinary, get its url and duration
    // create new vidoe doc with details obtained

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    const videoFileRegex = /\.(mp4|mkv|avi|mov|wmv|flv)$/i;
    const thumbnailRegex = /\.(jpg|jpeg|png)$/i;
    
    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }
    if (!videoFileRegex.test(videoLocalPath)) {
        throw new ApiError(500, "Invalid video file")
    }
    if (!thumbnailRegex.test(thumbnailLocalPath)) {
        throw new ApiError(500, "Invalid thumbnail file")
    }

    try {
        const uploadVideo = await uploadOnCloudinary(videoLocalPath)
        const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
        if (!uploadVideo) {
            throw new ApiError(500, "Something went wrong while uploading video on cloudinary")
        }
        console.log(uploadVideo);
        if (!uploadThumbnail) {
            throw new ApiError(500, "Something went wrong while uploading thumbnail on cloudinary")
        }
    
        const newVideo = await Video.create({
            videoFile: uploadVideo.url,
            thumbnail: uploadThumbnail.url,
            title,
            description,
            owner: userId,
            duration: uploadVideo.duration
        })
    
        if (!newVideo) {
            throw new ApiError(500, "Something went wrong while uploading video")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, newVideo, "video uploaded successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while uploading video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
