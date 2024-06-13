import mongoose from "mongoose";
import { User } from "../model/user.models.js";
import { Video } from "../model/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import {
    deleteFileFromCloudinary,
    uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const uplodedVideo = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the data from the request body and store it in a variable
     * step 2: check if data is not empty
     * setp 3: check title and description is not alredy present
     *
     */

    const { title, description, isPublished } = req.body;

    if ([title, description, isPublished].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    try {
        const existingVideo = await Video.findOne({
            $or: [{ title: title.trim() }, { description: description.trim() }],
        });

        if (existingVideo) {
            throw new ApiError(
                409,
                "Video already exists with this title or description"
            );
        }

        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
        const videoLocalPath = req.files?.videoFile[0]?.path;

        if (!thumbnailLocalPath || !videoLocalPath) {
            throw new ApiError(400, "Thumbnail and video are required");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        const video = await uploadOnCloudinary(videoLocalPath);

        const newVideo = await Video.create({
            title,
            description,
            duration: video?.duration || null,
            thumbnail: thumbnail?.url || null,
            videoFile: video?.url || null,
            isPublished,
            owner: new mongoose.Types.ObjectId(req.user._id),
            views: 0,
        });

        if (!newVideo) {
            throw new ApiError(500, "Error while uploading video");
        }

        res
            .status(201)
            .json(
                new ApiResponce(200, newVideo, "Video uploaded successfully")
            );
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Somthing went wrong while uploading video"
        );
    }
});

const getChannalsVideo = asyncHandler(async (req, res) => {
    const { username } = req.params;

    try {
        const userId = await User.findOne({ username }).select("_id");

        if (!userId) {
            throw new ApiError(404, "User not found");
        }

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                    isPublished: true,
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                },
            },
            {   
                $sort: {
                    createdAt: -1,
                },
            },
        ]);



        if (!videos) {
            throw new ApiError(404, "Videos not found");
        }

        res
            .status(200)
            .json(new ApiResponce(200, videos, "Videos are fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while fetching videos");

    }
});
const getMyChannalsVideo = asyncHandler(async (req, res) => {
    const { username } = req.User;

    try {
        const userId = await User.findOne({ username }).select("_id");

        if (!userId) {
            throw new ApiError(404, "User not found");
        }

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                    isPublished: true,
                },
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    duration: 1,
                    views: 1,
                    createdAt: 1,
                },
            },
            {   
                $sort: {
                    createdAt: -1,
                },
            },
        ]);



        if (!videos) {
            throw new ApiError(404, "Videos not found");
        }

        res
            .status(200)
            .json(new ApiResponce(200, videos, "Videos are fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while fetching videos");

    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(401, "Unauthorized to delete this video");
        }

        const thumbnail = video.thumbnail;
        const videoFile = video.videoFile;

        const deletedVideo = await Video.findByIdAndDelete(id);

        if (!deletedVideo) {
            throw new ApiError(500, "Error while deleting video");
        }

        await deleteFileFromCloudinary(thumbnail);
        await deleteFileFromCloudinary(videoFile);

        res.status(200).json(new ApiResponce(200, {}, "Video deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while deleting video");
    }
});

const updateTitleAndDescription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    if ([title, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    try {

        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const existingVideo = await Video.findOne({
            $or: [{ title: title.trim() }, { description: description.trim() }],
        })

        if (existingVideo) {
            throw new ApiError(409, "Video already exists with this title or description");
        }

        if (video.title.trim() === title.trim() && video.description.trim() === description.trim()) {
            throw new ApiError(400, "No changes found");
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(401, "Unauthorized to update this video");
        }

        video.title = title.trim();
        video.description = description.trim();

        const updatedVideo = await video.save().select("-createdAt -updatedAt -__v");

        if (!updatedVideo) {
            throw new ApiError(500, "Error while updating video");
        }

        res
            .status(200)
            .json(new ApiResponce(200, updatedVideo, "Video title and description updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while updating video");

    }
});

const updateThumbnail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    try {
        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        const toBeDeleteThumbnail = video.thumbnail;

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(401, "Unauthorized to update this video");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(500, "Error while updating thumbnail");
        }


        video.thumbnail = thumbnail.url;

        const updatedVideo = await video.save();

        if (!updatedVideo) {
            throw new ApiError(500, "Error while updating video");
        }

        await deleteFileFromCloudinary(toBeDeleteThumbnail);

        res
            .status(200)
            .json(new ApiResponce(200, updatedVideo, "Video thumbnail updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while updating video");
    }

})


const increseViewCount = asyncHandler(async (req, res) => {

    const { id } = req.params;

    try {
        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        video.views = video.views + 1;

        const updatedVideo = await video.save();

        if (!updatedVideo) {
            throw new ApiError(500, "Error while updating video");
        }

        console.log(updatedVideo)

        res
            .status(200)
            .json(new ApiResponce(200, updatedVideo, "Video viewed count updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while updating video");
    }


})

const changeIsPublished = asyncHandler(async (req, res) => {

    const { id } = req.params;

    try {
        const video = await Video.findById(id);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(401, "Unauthorized to update this video");
        }

        video.isPublished = !video.isPublished;

        const updatedVideo = await video.save();

        if (!updatedVideo) {
            throw new ApiError(500, "Error while updating video");
        }

        res
            .status(200)
            .json(new ApiResponce(200, updatedVideo.isPublished, "Video published status updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error while updating video");
    }


})



export { uplodedVideo, getChannalsVideo, deleteVideo, updateTitleAndDescription, updateThumbnail, increseViewCount, changeIsPublished, getMyChannalsVideo };
