import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';
const app = express();

// config cors middleware
app.use(cors(
    {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
));

// config json middleware
// aa etle use thay ke json middleware ma limited data ave
app.use(express.json(
    {
        limit: '16kb'
    }
));

// config url encoded middleware
app.use(express.urlencoded(
    {
        extended: true,
        limit: '16kb'
    }
));

// config static file
app.use(express.static(
    'public'
))

// config cookie parser middleware
app.use(cookieParser())



// router

app.get('/', (req, res) => { res.send('hello world') })
app.use('/api/v1/users',userRouter)

export { app }



// refresh token :- refresh token is used to get new access token when old access token is expired based on refresh token match with database's refresh token.

// authentication tocken :- it is used to authenticate user when user is logged in.



// url : uniform resource locator
// uri : uniform resource identifier
// urn : uniform resource name