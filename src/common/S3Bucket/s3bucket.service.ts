import { randomUUID } from 'crypto';
import {DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client} from "@aws-sdk/client-s3"
import { ACCESS_KEY_ID, APPLICATION_Name, BUCKET_NAME, REGION, SECRET_ACCESS_KEY } from '../../config/config.service.js';
import { Upload } from "@aws-sdk/lib-storage";
import { StorageApproachEnum } from '../enums/multer.enums.js';
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import { get } from 'http';
import path from 'path/win32';
class S3BuketService {
    private _client = new S3Client({
        region:REGION,
        credentials:{
            accessKeyId:ACCESS_KEY_ID,
            secretAccessKey:SECRET_ACCESS_KEY,
        }
    })
    async uploadFile({
        file , 
        path,
    }: {
        file: Express.Multer.File, 
        path: string,
    }){
        const command = new PutObjectCommand({
            Bucket:BUCKET_NAME,
            Key:`${APPLICATION_Name}/${path}/${randomUUID()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: ObjectCannedACL.private,
        })
        await this._client.send(command)
        return command.input.Key!
    }

    async createPreSignedUrlUploadFile({
        originalname ,
        contentType, 
        path,
    }: {
        originalname: string,
        contentType: string,
        path: string,
    }){
        const command = new PutObjectCommand({
            Bucket:BUCKET_NAME,
            Key:`${APPLICATION_Name}/${path}/${randomUUID()}_${originalname}`,
            ContentType: contentType,
            ACL: ObjectCannedACL.private,
        })
        const url = await getSignedUrl(this._client, command, { expiresIn: 3600 })
        return {key:command.input.Key!, url}
    }

    async uploadLargeFiles({
        file , 
        path,
        uploadApproach = StorageApproachEnum.Disk
    }: {
        file: Express.Multer.File, 
        path: string,
        uploadApproach?: StorageApproachEnum
    }){
        const commond = new Upload({
            client: this._client,
            params: {
                Bucket:BUCKET_NAME,
                Key:`${APPLICATION_Name}/${path}/${randomUUID()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            }
        })
        commond.on("httpUploadProgress", (progress)=>{
            console.log(progress)
        })
        const uploadedFile = await commond.done()
        return uploadedFile.Key as string
    }

    async uploadFiles({
        files , 
        path,
        uploadApproach = StorageApproachEnum.Memory
    }: {
        files: Express.Multer.File[], 
        path: string,
        uploadApproach?: StorageApproachEnum
    }){
   const keys = await Promise.all(
    files.map((file)=>{
    return uploadApproach == StorageApproachEnum.Memory 
    ? this.uploadFile({ file, path }) 
    : this.uploadLargeFiles({ 
        file, 
        path, 
        uploadApproach: StorageApproachEnum.Disk 
    })
  })
)
return keys
    }

    async createPreSignedGetFile(
        {
        Key,
        filename,
        download,
        }: {
        Key:string, 
        filename?:string
        download?:string
    } ){
        const command = new GetObjectCommand({
            Bucket:BUCKET_NAME,
            Key,
            ResponseContentDisposition: download == "true" ? `attachment; filename=${filename}` : undefined,
        })
        return await getSignedUrl(this._client, command, { expiresIn: 3600 })
    }

    async getFile(Key:string ){
        const command = new GetObjectCommand({
            Bucket:BUCKET_NAME,
            Key,
        })
        return await this._client.send(command)
    }

    async deleteFile(Key:string){
        const command = new DeleteObjectCommand({
            Bucket:BUCKET_NAME,
            Key,
        })
       return await this._client.send(command)
    }

    async deleteFiles(Keys: {Key:string}[]){
        const command = new DeleteObjectsCommand({
            Bucket:BUCKET_NAME,
            Delete:{ Objects: Keys},
        })
       return await this._client.send(command)
    }

    async listFolderKeys(Prefix:string){
        const command = new ListObjectsV2Command({
            Bucket:BUCKET_NAME,
            Prefix: `${APPLICATION_Name}/${Prefix}`,
        })
        return await this._client.send(command)
    }
}

export default new S3BuketService()