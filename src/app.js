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


app.use('/api/v1/users',userRouter)



export { app }




// url : uniform resource locator
// uri : uniform resource identifier
// urn : uniform resource name