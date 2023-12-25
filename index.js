// try catch for error handling
// databse is always in other continates
// must use async await
import dotenv from 'dotenv';
import connectDB from './src/DB/index.js'
import { app } from './src/app.js'


dotenv.config({
    path: "./.env"
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
import connectDB from './src/DB/index';
import connectDB from './src/DB/index';
import connectDB from './src/DB/index';
import connectDB from './src/DB/index';


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