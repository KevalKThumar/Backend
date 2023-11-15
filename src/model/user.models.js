// JSON is text-based and easy for humans to read and write, while BSON is a binary-encoded version of JSON that is more efficient for certain applications, especially in the context of databases and data storage.




import mongoose from 'mongoose';
import Jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true, // To enable searching in this field
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        fullname: {
            type: String,
            required: [true, 'Fullname is required'],
            trim: true,
            index: true, // To enable searching in this field

        },
        avatar: {
            type: String, //cloudinary url or path to image ,
            required: [true, 'Avatar is required'],
        },
        coverimage: {
            type: String
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video'
            }
        ],
        likedVideo: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video'
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

// in this callback function dont use arrow function as it will not work because this keyword is not available in arrow function.

// mogoose middleware for hashing password
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) return
    {
        this.password = bcryptjs.hash(this.password, 10);
        next();
    }
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcryptjs.compare(password, this.password)
}

userSchema.methods.createJWT = function () {
    return Jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.createRefreshJWT = function () {
    return Jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)