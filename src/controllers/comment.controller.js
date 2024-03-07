import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const isOwner = async (commnetId, req) => {
    const comment = await Comment.findById(commnetId)

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        console.log(comment?.owner.toString());
        console.log(req.user?._id.toString());
        return false
    }
    return true
}

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(404, "Video Id is required")
    }

    const doesVideoExists = await Comment.find({video: videoId})
    if (!doesVideoExists) {
        throw new ApiError(404, "Video does not exists")
    }

    const skip = (page - 1) * limit;

    try {
        
        const comments = await Comment.find(
            {
                video: videoId
            }
        ).skip(skip)

        if (!comments) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while fectching video comments from DB"))
        }
        
        return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"))

    } catch (error) {
        throw new ApiError(400, error?.message ||"Something went wrong while fectching video comments")
    }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "Login to add comment")
    }
    if (!content) {
        throw new ApiError(400, "Comment is required")
    }
    if (!videoId) {
        throw new ApiError(400, "Vidoe Id is required")
    }

    try {
        const newComment = await Comment.create(
            {
                content,
                video: videoId,
                owner: userId
            }
        )

        if (!newComment) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while adding comment in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, newComment, "New comment added successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while adding comment")
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId }  = req.params
    const { content } = req.body

    const doesCommentExists = await Comment.findById(commentId) 
    if (!doesCommentExists) {
        throw new ApiError(404, "Comment does not exists")
    }

    const authorized = await isOwner(commentId, req)

    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    try {
        const commentResponse = await Comment.findByIdAndUpdate(
            commentId,
            {
                content
            },
            {new: true}
        )

        if (!commentResponse) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while updating comment in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, commentResponse, "Comment updated successfully"))

    } catch (error) {
        throw new ApiError(400, error?.message ||"Something went wrong while updating comment")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId }  = req.params
    console.log(req.params)

    const doesCommentExists = await Comment.findById(commentId) 
    if (!doesCommentExists) {
        throw new ApiError(404, "Comment does not exists")
    }   

    const authorized = await isOwner(commentId, req)

    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    try {
        const commentResponse = await Comment.findByIdAndDelete(commentId)

        if (!commentResponse) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while deleting comment in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, commentResponse, "Comment deleted successfully"))

    } catch (error) {
        throw new ApiError(400, error?.message ||"Something went wrong while deleting comment")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
