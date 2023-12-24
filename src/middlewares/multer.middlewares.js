import multer from "multer";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/test")
    },
    filename: function (req, file, cb) {
        // here we can change the file name to make it unique for each user or post


        cb(null, file.originalname + '_' + Date.now())
    }
})

 export const upload = multer({ storage, })