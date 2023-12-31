import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});



const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("localFilePath is required");
            return null;
        }

        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            invalidate: true
        })
        fs.unlinkSync(localFilePath);
        return responce

    } catch (error) {
        // remove the localy seve temp file if any error happens while uploading the file on cloudinary server.
        fs.unlinkSync(localFilePath);
        return null
    }
}

// delete file from cloudinary server

const deleteFileFromCloudinary = async (imagePathToBeDelete) => {
    try {
        if (!imagePathToBeDelete) {
            console.log("imagePathToBeDelete is required");
            return null;
        }
        const responce = await cloudinary.uploader.destroy(imagePathToBeDelete);
        return responce  
    } catch (error) {
        throw new Error(error.message)
    }
}


export { uploadOnCloudinary, deleteFileFromCloudinary }