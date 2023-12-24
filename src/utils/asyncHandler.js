// higher order function is the function that takes another function as an argument and returns another function

// const asyncHandler =()=>{}
// const asyncHandler =(func)=>{()=>{}}
// const asyncHandler =(func)=>{async ()=>{}}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)

//     } catch (error) {
//         res.status(error.code ||500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }


const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(
            requestHandler(req, res, next)
        ).catch(
            (error) => next(error)
        )
    }

}

export { asyncHandler }