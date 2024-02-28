import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from "./app.js";
import { log } from "console";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server Listening on port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("Mongo db connection failed !!! ", err);
})











// 1st approach
// const app = express()
// iife to connect with DB
// ;( async () => {
//     try {
//         const obj = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("ERR", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App listening on port ${process.env.PORT}`);
//         })
//         console.log(obj);
//     } catch (error) {
//         console.error("ERRR: ", error)
//         throw error
//     }
// })()