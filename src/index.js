import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./db/index.js";

dotenv.config({
    path: "./.env",
    debug: true
})

const PORT = process.env.PORT || 8001
const HOST = process.env.HOST

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://${HOST}:${PORT}`)
        })
    })
    .catch(err => {
        console.log("MongoDB Connection Error ", err)
    })