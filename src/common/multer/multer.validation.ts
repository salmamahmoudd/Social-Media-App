import type { FileFilterCallback } from "multer";
import type { Request } from "express";
import { BadRequestException } from "../exceptions/domin.exception.js";

export const allowedFileFormats = {
    img: ["image/png", "image/jpg", "image/jpeg"],
    video: ["video/mp4"],
    pdf: ["application/pdf"]
};

export function fileFilter(allowedFormate:string[]){
   return (req:Request, file:Express.Multer.File, cb:FileFilterCallback)=> {
        if (!allowedFormate.includes(file.mimetype)) {
            return cb(new BadRequestException("Invalid format"));
        }
        return cb(null, true);
};
}
