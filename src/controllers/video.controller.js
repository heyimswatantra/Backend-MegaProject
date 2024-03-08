import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const isOwner = async (videoId, req) => {
    const video = await Video.findById(videoId)
    (video?.owner.toString() !== req.user?._id.toString()) ? false : true
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId, tags } = req.query
    //TODO: get all videos based on query, sort, pagination

    // Define a base query
    let baseQuery = {};
    // Filtering based on the query parameter
    if (query) {
        baseQuery = {
            $or: [
                { title: { $regex: query, $options: 'i' } }, // Case-insensitive title search
                { description: { $regex: query, $options: 'i' } }, // Case-insensitive description search
                { tags: { $in: tags } }, // Search by tags
            ],
        };
    } else {
        baseQuery = { tags: { $in: tags } }; // Only search by tags if query is not provided
    }

    // Add additional filters if needed, for example, filtering by userId
    if (userId) {
        baseQuery.owner = userId;
    }

    // Define sort options
    let sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;
    } else {
        // Default sorting if sortBy is not provided
        sortOptions = { createdAt: -1 };
    }

    // Pagination options
    const skip = (page - 1) * limit;

    // console.log("baseQuery : ", baseQuery)
    try {
        const videoList = await Video.find(baseQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)

        if (!videoList) {
            throw new ApiError(400, "something went wrong while searching video")
        }

        const data = {
            length: videoList.length,
            videoList
        }
        return res
        .status(200)
        .json(new ApiResponse(200, data, "Video List fetched successfully"))
    } catch (error) {
        throw new ApiError(400, error?.message ||"Something went wrong while quering vidoe")
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, tags} = req.body
    // TODO: get video, upload to cloudinary, create video
    const userId = req.user?._id
    const tagArr = tags.split(",").map((item) => item.trim())

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
        throw new ApiError(400, "Invalid video file")
    }
    if (!thumbnailRegex.test(thumbnailLocalPath)) {
        throw new ApiError(400, "Invalid thumbnail file")
    }

    try {
        const uploadVideo = await uploadOnCloudinary(videoLocalPath)
        const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
        if (!uploadVideo) {
            throw new ApiError(500, "Something went wrong while uploading video on cloudinary")
        }
        // console.log(uploadVideo);
        if (!uploadThumbnail) {
            throw new ApiError(500, "Something went wrong while uploading thumbnail on cloudinary")
        }
    
        const newVideo = await Video.create({
            videoFile: uploadVideo.url,
            thumbnail: uploadThumbnail.url,
            title,
            description,
            owner: userId,
            duration: uploadVideo.duration,
            tags: tagArr
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
    // find and return the video

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    try {
        const videoViews = await Video.findById(videoId)
        // console.log(videoViews.views);
        videoViews.views++
        const videoResponse = await Video.findByIdAndUpdate(
            videoId,
            {
                views: videoViews.views
            }
        )
    
        if (!videoResponse) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while fetching video from DB"))
        }
    
        if (!videoResponse.isPublished) {
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "This video has been made private by the video owner"))
        }
        return res
        .status(200)
        .json(new ApiResponse(200, videoResponse, "Video fetched successfully"))
    } catch (error) {
        throw new ApiError(400, "Something went wrong while fetching video")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description, isPublished, tags } = req.body
    const tagArr = tags.split(",").map((item) => item.trim())

    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }
    
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video does not exists")
    }

    const authorized = await isOwner(videoId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized request")
    }

    try {

        const thumbnailLocalPath = req.file?.path
        // scoping caused error here :(
        let thumbnailResponse;
        if (thumbnailLocalPath) {
            thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath)

            if (!thumbnailResponse) {
                throw new ApiError(500, "Something went wrong while uploading thumbnail")
            }
        }

        const updateData = {
            thumbnail: thumbnailResponse?.url
        }
        // optionally check for title and description
        if (title) updateData.title = title
        if (description) updateData.description = description
        if (isPublished) updateData.isPublished = isPublished
        if (tags) {
            const tagsResponse = await Video.findById(videoId)
            updateData.tags = tagArr.concat(tagsResponse.tags)
        }

        const videoUpdateResponse = await Video.findByIdAndUpdate(
            videoId,
            updateData,
            {new: true}
        )

        if (!videoUpdateResponse) {
            throw new ApiError(400, "Something went wrong while updating video in DB")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, videoUpdateResponse, "Video updated successfully"))

    } catch (error) {
        throw new ApiError(400, "Something went wrong while updating video")
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video does not exists")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const authorized = await isOwner(videoId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized request")
    }
    
    try {
        
        const deleteResponse = await Video.findByIdAndDelete(videoId)

        if (!deleteResponse) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while deleting video in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deleteResponse, "Video deleted successfully"))

    } catch (error) {
        throw new ApiError(400, "Something went wrong while deleting video")
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video does not exists")
    }

    const authorized = await isOwner(videoId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized request")
    }

    try {
        const videoDoc = await Video.findById(videoId)
        // console.log(videoDoc.isPublished);
        const togglePublishStatusResponse = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {isPublished: !videoDoc.isPublished}
            },
            {new: true}
        )

        // console.log(togglePublishStatusResponse);
        if (!togglePublishStatusResponse) {
            throw new ApiError(400, "Something went wrong while Toggling Publish Status in DB")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, togglePublishStatusResponse, "Toggled Publish Status successfully"))
    } catch (error) {
        throw new ApiError(400, "Something went wrong while Toggling Publish Status")
    }

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
