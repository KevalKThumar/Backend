import { User } from "../model/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    /*
       *    step 1: get the data from the request body and store it in a variable
            step 2: check if data is not empty
            step 3: check if the user is already present in the database or not with email or username
            step 4: if user is not present then create a new user       
            step 5: send the response in success with status code 200 
            step 6: catch the error
            step 7: send the response in catch part
       */

    const { username, email, password, fullname } = req.body;

    console.log(req.body);

    if (
        [username, email, password, fullname].some((field) => field.trim() === "")
    ) {
        throw new ApiError("All fields are required", 400);
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
        throw new ApiError("User already exists with this email or username", 409);
    }

    const avatarImageLocakPath = req.files?.avatar[0]?.path;
    const coverImageLocakPath = req.files?.coverimage[0]?.path;

    if (!avatarImageLocakPath) {
        throw new ApiError("Avatar image is required", 400);
    }

    const avatar = await uploadOnCloudinary(avatarImageLocakPath);
    const coverimage = await uploadOnCloudinary(coverImageLocakPath);

    if (!avatar) {
        throw new ApiError("Error while uploading avatar on cloudinary", 500);
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
    });

    const checkUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!checkUser) {
        throw new ApiError("Error while creating user", 500);
    }

    await user.save();

    return res.status(201).json(ApiResponce(200, "User created", checkUser));
});

const loginUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Login User",
    });
});


export { registerUser, loginUser };
