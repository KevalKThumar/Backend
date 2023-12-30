import { User } from "../model/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

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

    if (
        [username, email, password, fullname].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });


    if (existingUser) {
        throw new ApiError(409, "User already exists with this email or username")
    }


    const avatarImageLocakPath = req.files?.avatar[0]?.path;
    let coverImageLocakPath;




    if (!avatarImageLocakPath) {
        throw new ApiError(400, "Avatar image is required");
    }
    const avatar = await uploadOnCloudinary(avatarImageLocakPath);
    let coverimage;

    if (req.files && req.files.coverimage && req.files.coverimage.length > 0) {
        coverImageLocakPath = req.files?.coverimage[0]?.path;
        coverimage = await uploadOnCloudinary(coverImageLocakPath);
    }


    if (!avatar) {
        throw new ApiError(500, "Error while uploading avatar image");
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
        throw new ApiError(500, "Error while creating user");
    }

    await user.save();

    return res.status(201).json(new ApiResponce(200, checkUser, "User registered Successfully"));
});

const generatAccessandRefreshToken = async (user) => {
    try {
        const newuser = await User.findById(user._id);
        const accessToken = newuser.createJWT();
        const refreshToken = newuser.createRefreshJWT();

        newuser.refreshToken = refreshToken;
        await newuser.save({
            validateBeforeSave: false
        });

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError(500, error.message || "Somthing went wrong while generating access and refresh token");
    }
}

const loginUser = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the data from the request body and store it in a variable
     * step 2: check if data is not empty 
     * step 3: check if the user is present in the database
     * step 4: if user is not present then send the response in error with status code 404
     * step 4: if user is present then check the password
     * step 5: if password is correct then send the response in success with status code 200
     * step : generate the tokens 
     * step : send data in cookies with status code 200
     * step 6: catch the error
     * step 7: send the response in catch part
     */

   


    const { email, username, password } = req.body;

    if (!(email || username)) {
        throw new ApiError(400, "Email or username is required");
    }

    const user = await User.findOne(
        {
            $or: [
                { email },
                { username }
            ]
        }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect password");
    }



    const { accessToken, refreshToken } = await generatAccessandRefreshToken(user._id);

    // at this point we are go with two way 1) if we are call databsee query again or 2) if we are not call database query again and update the database of user


    const loggdeInUser = await User.findById(user._id).select("-password -refreshToken");

    if (!loggdeInUser) {
        throw new ApiError(500, "Error while logging in user");
    }

    res.status(201)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
        })
        .json(
            new ApiResponce(
                200,
                {
                    user: loggdeInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {



    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true    //other thing are not change
        }
    )

    res.status(200)
        .clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
        })
        .clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        })
        .json(new ApiResponce(200, "User logged out successfully"));

}
)

const refreshAccessTocken = asyncHandler(async (req, res) => {
    const newRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!newRefreshToken) {
        throw new ApiError(400, "Refresh token is required")
    }

    try {
        const decoded = jwt.verify(newRefreshToken, process.env.REFERESH_TOKEN_SECRET);

        const user = await User.findById(decoded?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }


        if (newRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired")
        }

        const { accessToken, newrefreshToken } = await generatAccessandRefreshToken(user);

        return res.status(200)
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: true,
            })
            .cookie("refreshToken", newrefreshToken, {
                httpOnly: true,
                secure: true,
            })
            .json(
                new ApiResponce(
                    200,
                    "access token refreshed successfully",
                    {
                        accessToken, newrefreshToken
                    }
                ),
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "Somthing went wrong while generating access and refresh token");
    }


})

export { registerUser, loginUser, logoutUser, refreshAccessTocken };
