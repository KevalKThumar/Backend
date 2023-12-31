import { User } from "../model/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { deleteFileFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js";
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the old password and new password from the request body and store it in a variable
     * step 2: check if data is not empty
     * setp 3: we add middleware for check user is logged in or not if yes then ot return user in req.user
     * setp 4: get user's id from req.user
     * setp 5: find user by id
     * setp 6: check if user is not found this step is not required becuse we are using middleware for check user is logged in or not
     * setp 7: check if oldpassword is correct 
     * setp 8: update password
     * setp 9: save the user
     * setp 10: send the response
     * setp 11: catch the error
     */
    try {
        console.log(req.body)

        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user?._id);

        const isPasswordCorreact = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorreact) {
            throw new ApiError(400, {}, "Old password is not correct");
        }

        user.password = newPassword;

        await user.save({
            validateBeforeSave: false
        });

        return res.status(200).json(new ApiResponce(200, user, "Password changed successfully"));

    } catch (error) {
        throw new ApiError(500, error?.message || "Somthing went wrong while changing current password");
    }
})

const getCutrrentUser = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the user's id from the request.user because we are using middleware for check user is logged in or not
     * step 2: find user by id
     * step 3: send the response
     * step 4: catch the error
     */

    try {
        return res.status(200).json(new ApiResponce(200, req.user, "User found successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message || "Somthing went wrong while getting current user");
    }
})

const updateUserDetailsText = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the user's id from the request.user because we are using middleware for check user is logged in or not
     * step 2: find user by id update user
     * step 3: save the user
     * step 4: send the response
     * step 5: catch the error
     */

    try {

        const { email, fullname } = req.body;

        if ([email, fullname].some((field) => field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new ApiError(409, "User already exists with this email try with another email")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullname,
                    email
                }
            },
            {
                new: true,
            }

        ).select("-password");

        return res
            .status(200)
            .json(
                new ApiResponce(
                    200, user, "User details updated successfully"
                )
            )

    } catch (error) {

        throw new ApiError(
            500, error?.message || "Somthing went wrong while updating user details"
        );

    }

})

const updateUserFileAvatar = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the user's id from the request.user because we are using middleware for check user is logged in or not
     * step 2: find user by id  update user
     * step 3: save the user
     * step 4: send the response
     * step 5: catch the error
    */

    try {
        const localPathOfAvatar = req.file?.path


        if (!localPathOfAvatar) {
            throw new ApiError(500, "Avatar image not found");
        }


        const avatarUrl = await uploadOnCloudinary(localPathOfAvatar);

        if (!avatarUrl.url) {
            throw new ApiError(500, "Error while uploading avatar image");

        }

        const oldImageUrl = req.user?.avatar;


        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatarUrl.url
                }
            },
            {
                new: true,
            }
        ).select("-password");

        await deleteFileFromCloudinary(oldImageUrl);

        return res
            .status(200)
            .json(
                new ApiResponce(
                    200, user, "User details updated successfully"
                )
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Somthing went wrong while updating user details");

    }
})

const updateUserFileCorverImage = asyncHandler(async (req, res) => {
    /**!SECTION
     * step 1: get the user's id from the request.user because we are using middleware for check user is logged in or not
     * step 2: find user by id  update user
     * step 3: save the user
     * step 4: send the response
     * step 5: catch the error
    */

    try {
        const localPathOfCorverImage = req.file?.path


        if (!localPathOfCorverImage) {
            throw new ApiError(500, "CorverImage image not found");
        }


        const corverImageUrl = await uploadOnCloudinary(localPathOfCorverImage);

        if (!corverImageUrl.url) {
            throw new ApiError(500, "Error while uploading CorverImage image");

        }

        const oldImageUrl = req.user?.coverimage

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverimage: corverImageUrl.url
                }
            },
            {
                new: true,
            }
        ).select("-password");


        await deleteFileFromCloudinary(oldImageUrl);

        return res
            .status(200)
            .json(
                new ApiResponce(
                    200, user, "User details updated successfully"
                )
            )

    } catch (error) {
        throw new ApiError(500, error?.message || "Somthing went wrong while updating user details");

    }
})



export { registerUser, loginUser, logoutUser, refreshAccessTocken, changeCurrentPassword, getCutrrentUser, updateUserDetailsText, updateUserFileAvatar, updateUserFileCorverImage };
