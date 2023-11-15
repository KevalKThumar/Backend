import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {

        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        videoFile: {
            type: String,
            required: [true, 'Video is required'],
            trim: true,
        },
        thumbnail: {
            type: String,
            required: [true, 'Thumbnail is required'],
            trim: true,
        },
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        duration:{
            type: Number, 
            required: true
        },
        isPublished:{
            type: Boolean,
            default: true,
        },
        views:{
            type: Number,
            default: 0
        }
    

        
    },
    {
        timestamps: true
    }
)


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)