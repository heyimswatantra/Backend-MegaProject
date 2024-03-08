import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const isOwner = async (playlistId, req) => {
    const playlist = await Playlist.findById(playlistId)

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        return false
    }
    return true
}

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user?._id
    //TODO: create playlist

    if (!userId) {
        throw new ApiError(300, "Logging to create playlist")
    }

    if (!name) {
        throw new ApiError(400, "Playlist name is required")
    }

    const playlistData = {
        name,
        owner: userId
    }

    description && (playlistData.description = description);
    
    try {
        const playlist = await Playlist.create(playlistData)

        if (!playlist) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while creating playlist in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while creating playlist")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    
    if (!userId) {
        throw new ApiError(400, "User is required")
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const authorized = userId.toString() === req.user?._id.toString()
    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    try {
        
        const userPlaylist = await Playlist.find({ owner: userId })

        if (!userPlaylist) {
            return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong while fetching playlist from DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, userPlaylist, "Playlist fetched successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while fetching playlist")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    try {
        
        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Playlist does not exists"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while fetching playlist")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }
    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }    

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const authorized = isOwner(playlistId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    try {
        const addVideoToPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {$push: {video: videoId}},
            {new: true}
        )

        if (!addVideoToPlaylist) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Cannot add video to playlist"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, addVideoToPlaylist, "Video added to playlist successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while adding vidoe to playlist")
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }
    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }    

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const authorized = isOwner(playlistId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    try {
        // use $pull to remove videoId from video property of Playlist model
        const removeVideo = await Playlist.findByIdAndUpdate(
            playlistId,
            {$pull: {video: videoId}},
            {new: true}
        )

        if (!removeVideo) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Cannot remove video from playlist"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, removeVideo, "Video removed from playlist successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while removing vidoe from playlist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const authorized = await isOwner(playlistId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    try {
        
        const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

        if (!deletePlaylist) {
            return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong while deleting playlist in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deletePlaylist, "Playlist deleted successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while deleting playlist")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!name && !description) {
        throw new ApiError(400, "Provide data to be updated")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const authorized = await isOwner(playlistId, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized Request")
    }

    const updateData = {}
    name && (updateData.name = name)
    description && (updateData.description = description)

    try {
        
        const updatePlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            updateData,
            {new: true}
        )

        if (!updatePlaylist) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while updating playlist in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "Playlist updated successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while updating playlist")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
