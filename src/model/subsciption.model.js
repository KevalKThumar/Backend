import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscription:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channels:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})



export const Subscription = mongoose.model("Subscription",subscriptionSchema)