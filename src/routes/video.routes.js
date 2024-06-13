import { Router } from "express";


import { upload } from "../middlewares/multer.middlewares.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";
import { changeIsPublished, deleteVideo, getChannalsVideo, getMyChannalsVideo, increseViewCount, updateThumbnail, updateTitleAndDescription, uplodedVideo } from "../controller/video.controller.js";


const router = Router();

router.route('/get-channel/:username').get(getChannalsVideo)
router.route('/mychannel/:username').get(verifyToken, getMyChannalsVideo)

router.route('/delete/:id').delete(verifyToken, deleteVideo)

router.route('/upload').post(
    verifyToken, upload.fields([
        {
            name: 'videoFile',
            maxCount: 1
        },
        {
            name: 'thumbnail',
            maxCount: 1
        }
    ]),
    uplodedVideo
)

router.route('/update-title/:id').patch(verifyToken, updateTitleAndDescription)

router.route('/update-thumbnail/:id').patch(verifyToken, upload.single('thumbnail'), updateThumbnail)

router.route('/update-visibility/:id').patch(verifyToken, changeIsPublished)

router.route('/increment-views/:id').get(increseViewCount)


export default router