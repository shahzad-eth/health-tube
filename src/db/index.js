import mongoose from "mongoose";
import { DB_NAME } from "../constants/index.js"
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
    try {
        const DBConnection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(` \n DB Connection Successful ! DB HOST ${DBConnection.connection.host}`)
    } catch (error) {
        console.log("MongoDB Connection error : ", error);
        process.exit(1);
    }
}