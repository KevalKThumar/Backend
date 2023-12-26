
import mongoose from "mongoose";

const testSchema = mongoose.Schema({
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    }
})

export const Test = mongoose.model("Test", testSchema)