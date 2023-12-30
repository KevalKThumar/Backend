import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";
import { User } from './../model/user.models.js';
import { logoutUser } from "../controller/user.controller.js";


export const verifyToken = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Not authorized")
        }

        const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            // TODO: create error
            throw new ApiError(401, "Invalid access token")
        }

        req.user = user

        next()
    } catch (error) {

        throw new ApiError(500, error.message || "something went wrong while verifying token")

    }
})



