import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler( async (req, res) => {
    // steps to register a user
    // get user details from frontend
    // validation of passed fields (not empty)
    // check if user already exits (username, email)
    // email validation (regex)
    // check for images: avatar
    // upload imgs to cloudinary
    // create to user obj to be pushed to DB 
    // check for user creation response
    // remove password and refresh token from DB response
    // return response

    const {fullName, email, username, password} = req.body
    // console.log(req.body);

    // now we have to validate all the fields
    // instead of looping or checking all fields one by one, we can use .some() method
    // some() takes a cb func and return true if any ele of arr satisfies the condition in cb func

    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields required")
    }

    // find if there already exists a user with same username OR email
    // we can use operators "$or"
    const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user Obj
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    // remove pass and refresh token
    const createUser = await User.findById(user._id)
    .select("-password -refreshToken")

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User register successfully")
    )

})

export {registerUser}