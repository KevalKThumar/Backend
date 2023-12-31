import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channels: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })



export const Subscription = mongoose.model("Subscription", subscriptionSchema)

/**
 *   In this if we find the total subscriber of the TOTALGAMING channel then we find the total this type of documents in which channal is TOTALGAMING.
 *  if we find the total number of channels that TOTALGAMING is subscribed to then we find the total number of documents in which subscription is TOTALGAMING.
 */

// Aggricate Pipeline

/**!SECTION
 *     1) lookup: it is use to join two collections based on foreign key and local value and it return as a first value of the document 
 *     2) match: it is use to match the documents based on the condition
 *     3) first: it is use to return the first value of the array as an object.
 */