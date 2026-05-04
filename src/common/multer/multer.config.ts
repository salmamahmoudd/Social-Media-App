import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { StorageApproachEnum } from "../enums/multer.enums.js";
import {fileFilter, allowedFileFormats} from "./multer.validation.js";
function cloudFileUpload({
    storageApproach = StorageApproachEnum.Memory,
    allowedFormate = allowedFileFormats.img,
    fileSize = 5,
}:{
    storageApproach?:StorageApproachEnum;
    allowedFormate?:string[];
    fileSize?: number
}){
    const storage = 
    storageApproach == StorageApproachEnum.Memory
    ?multer.memoryStorage()
    :multer.diskStorage({
        destination(req,file,callback){
            callback(null,tmpdir())
        },
        filename(req,file,callback){
            callback(null, `${randomUUID()}_${file.originalname}`)
        }
    })
    return multer({
        storage , 
        fileFilter:fileFilter(allowedFormate), 
        limits:{fileSize: fileSize * 1024 * 1024
        }})
}
export default cloudFileUpload;