import { Router } from "express";
import { changeCurrentPassword, getCutrrentUser, getUserChannalDetails, getUsersWatchHistory, loginUser, logoutUser, refreshAccessTocken, registerUser, updateUserDetailsText, updateUserFileAvatar, updateUserFileCorverImage } from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();


router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverimage',
            maxCount: 1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

// secure routes

router.route('/logout').post(verifyToken, logoutUser)

router.route('/refresh-token').post(
    refreshAccessTocken
)

router.route('/change-password').post(verifyToken, changeCurrentPassword)

router.route('/get-user').get(verifyToken, getCutrrentUser)


router.route('/update/text-details').patch(verifyToken, updateUserDetailsText)

router.route('/update/file-details/avatar').patch(verifyToken,upload.single('avatar'),updateUserFileAvatar)

router.route('/update/file-details/coverimage').patch(verifyToken,upload.single('coverimage'),updateUserFileCorverImage)

router.route('/get-channel/:username').get(verifyToken, getUserChannalDetails)

router.route('/history').get(verifyToken,getUsersWatchHistory)






export default router