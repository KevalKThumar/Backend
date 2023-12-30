import { Router } from "express";
import { loginUser, logoutUser, refreshAccessTocken, registerUser } from "../controller/user.controller.js";
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

router.route('/logout').post(verifyToken,logoutUser)

router.route('/refresh-token').post(
    refreshAccessTocken
)



export default router