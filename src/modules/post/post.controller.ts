import { Router } from "express";
import successResponse from "../../common/response/success.response.js";
import cloudFileUpload from "../../common/multer/multer.config.js";
import { validateSignup } from "../../Middlewares/validation.middleware.js";
import { createPostSchema } from "./post.validation.js";

const postController = Router();

postController.post("/", 
    cloudFileUpload({}).array("attachments", 5),
    validateSignup(createPostSchema, true),
    (req, res) => {
  return successResponse({res, statusCode: 200});
});

export default postController;