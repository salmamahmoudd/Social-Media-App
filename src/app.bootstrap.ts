import express from "express";
import authController from "./modules/auth/auth.controller.js";
import globalErrHandlingMiddleware from "./Middlewares/globalErr.middlewar.js";
import { SERVER_PORT } from "./config/config.service.js";
import testDBConnection from "./DB/connection.js";
import { testRedisConnection } from "./DB/Redis/redis.connection.js";
import userController from "./modules/user/user.controller.js";
import cors from 'cors'
import s3bucketService from "./common/S3Bucket/s3bucket.service.js";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import successResponse from "./common/response/success.response.js";
async function bootstrap(){
    const app : express.Express = express();
    const port = SERVER_PORT;   

    app.use(express.json());
    app.use(cors());

    await testDBConnection();
    await testRedisConnection();

    app.get("/",(
        req : express.Request,
        res : express.Response,
        next: express.NextFunction
    ): void => {
        res.status(200).send("Welcome to the Social Media API");
    },
    );

    app.use("/auth", authController);
    app.use("/user", userController);

    app.get("/uploads/*path", async (req,res,next)=>{
        const {path} = req.params
        const {filename, download} = req.query
        const Key = req.params.path.join("/")
        const result = await s3bucketService.getFile(Key)
        const pipelinePromise = promisify(pipeline)
        if(download == "true"){
            res.setHeader("Content-Disposition", `attachment; filename="${filename || path[path.length - 1]}`)
        }
        await pipelinePromise(result.Body as NodeJS.ReadableStream, res)
    });
    app.get("/pre-signed-upload/*path", async (req,res,next)=>{
        const {path} = req.params
        const {filename, download} = req.query
        const Key = path.join("/")
        const result = await s3bucketService.createPreSignedGetFile({Key, filename: (filename as string) || (path[path.length - 1]) as string, download: download as string})
        return successResponse({ res, message: "file url created successfully" , data: result })
    });
    app.use("/*dummy", (
        req : express.Request,
        res : express.Response,
        next: express.NextFunction
    ): void => {
        res.status(404).json({ message: "Not Found" });
    });

    app.use(globalErrHandlingMiddleware)

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default bootstrap;