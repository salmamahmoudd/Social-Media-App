import type { JwtPayload } from "jsonwebtoken";
import type {Types} from "mongoose";
import userRepo from "../../DB/Repo/user.repo.js";
import redisService from "../../DB/Redis/redis.service.js";
import s3bucketConfig from "../../common/S3Bucket/s3bucket.service.js";
import type { IHUser } from "../../DB/Models/User.Model.js";
import { StorageApproachEnum } from "../../common/enums/multer.enums.js";
import type { ProfilePicDto } from "./user.dto.js";

class UserService{
private _userRepo = userRepo
private _redisService = redisService
private _s3BuketService = s3bucketConfig

async logout(
    userId:string | Types.ObjectId, 
    tokenData:JwtPayload, 
    logoutOptions:string
) {
if(logoutOptions == "all"){
  await this._userRepo.updateOne({
    filter:{_id:userId}, 
    update:{changeCreditTime:new Date()},
  })
}else{
 await this._redisService.set({
  key: this._redisService.getBlackListTokenKey({
    userId : userId as string, 
    tokenId: tokenData.jit as string,
  }),
  value: tokenData.jit as string, 
  exValue:  60 * 60 * 24 * 365 - (Date.now() / 1000 - tokenData.iat!)
})
}
}

async uploadProfilePic(bodyData:ProfilePicDto, user:IHUser){
 const {key, url} = await this._s3BuketService.createPreSignedUrlUploadFile({ 
    originalname: bodyData.originalname,
    contentType: bodyData.contentType,
    path:`user/${user._id}/profilePic` 
 })
 if(user.profilePic){
    await this._s3BuketService.deleteFile(user.profilePic)
 }
 user.profilePic = key
 await user.save()
  return {key, url}
}

async uploadCoverPics(files:Express.Multer.File[], user:IHUser){
const keys = await this._s3BuketService.uploadFiles({ files, 
path:`user/${user._id}/coverPic`,
uploadApproach:  StorageApproachEnum.Disk
})
if(user.coverPics.length){
    await Promise.all(user.coverPics.map((coverPic) => { this._s3BuketService.deleteFile(coverPic) }))  
}
user.coverPics = keys
await user.save()
return keys
}

async deleteUser(user:IHUser){
await user.deleteOne()
const files = await this._s3BuketService.listFolderKeys(`user/${user._id}/`)
const Keys = files.Contents?.map((file)=>{ return {Key: file.Key} })
await this._s3BuketService.deleteFiles(Keys as {Key:string}[])
}
}
export default new UserService();
