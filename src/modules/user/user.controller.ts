import express from "express";
import successResponse from "../../common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import userService from "./user.service.js";
import { validateSignup } from "../../Middlewares/validation.middleware.js";
import { logoutSchema, uploadProfilePicSchema } from "./user.validation.js";
import cloudFileUpload from "../../common/multer/multer.config.js";
import { StorageApproachEnum } from "../../common/enums/multer.enums.js";

const userController = express.Router();

userController.get("/", authentication(), (req,res)=>{
    return successResponse({ res, message: "user route is working" , data: req.user });
})

userController.post("/upload-profile-pic", authentication(), cloudFileUpload({
    storageApproach:StorageApproachEnum.Disk,
    fileSize:25,
}).single("profilePic"), validateSignup(uploadProfilePicSchema), async (req,res)=>{
  const result = await userService.uploadProfilePic(req.body, req.user)
    return successResponse({ res, message: "user update" , data: result });
})

userController.post("/upload-cover-pics", authentication(), cloudFileUpload({
    storageApproach:StorageApproachEnum.Memory,
    fileSize:25,
}).array("coverPics" , 5), async (req,res)=>{
  const result = await userService.uploadCoverPics(req.files as Express.Multer.File[], req.user)
    return successResponse({ res, message: "user update" , data: result });
})

userController.post("/logout", validateSignup(logoutSchema), authentication(), async (req,res)=>{
    const result = await userService.logout(
        req.user._id, 
        req.tokenPayload,
        req.body.logoutOption
    );
    return successResponse({res, data:result})
})

userController.delete("/", authentication(), 
 async (req,res)=>{
    const result = await userService.deleteUser(req.user)
    return successResponse({res, message:"user deleted successfully" , data:result})
});

export default userController;