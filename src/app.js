import express, {urlencoded} from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Application/json"],
  }),
);
app.use(express.json({limit: "16kb"}));
app.use(urlencoded({extended: true, limit: "16kb"}));
import {errorHandler} from "./middlewares/error.middleware.js";

import healthRouter from "./routes/health-check.route.js";
app.use("/api/v1/health-check", healthRouter);

import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

app.use(errorHandler);
export {app};
