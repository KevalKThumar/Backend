// try catch for error handling
// databse is always in other continates
// must use async await
import dotenv from 'dotenv';
import express from "express";
import connectDB from "./DB/index.js";
const app = express()

dotenv.config({
    path: "./env"
})

connectDB()
    .then(() => {

        app.on('error', (err) => {
            console.log("connection failed :-", err)
            throw err
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port: ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MongoDB Connection failed:-", err)
    });














/*
import { DB_NAME } from './constants';


    ; (async () => {
        try {

            await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

            app.on('error', (err) => {
                console.log("Error:-", err)
            })

            app.listen(process.env.PORT, () => {
                console.log(`Server is running on port ${process.env.PORT}`)
            })

        }
        catch (err) {
            console.log("Error:-", err)
        }
    })()*/