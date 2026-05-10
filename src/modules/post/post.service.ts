import type { Types } from "mongoose";
import type { PostSchemaDto } from "./post.dto.js";
import postRepo from "../../DB/Repo/post.repo.js";
import userRepo from "../../DB/Repo/user.repo.js";
import redisService from "../../DB/Redis/redis.service.js";
import { BadRequestException } from "../../common/exceptions/domin.exception.js";
import notificationService from "../../common/Notifiction/notifiction.service.js";

class PostService {
    private _postRepo = postRepo;
    private _userRepo = userRepo;
    private _redisService = redisService;
    private _notificationService = notificationService;

    async createPost(bodyData: PostSchemaDto, userId: Types.ObjectId | string
    ){
        const {tags} = bodyData;
        if(tags?.length){
            const mentionedUsers = await this._userRepo.find({
                filter: { _id: { $in: tags } }
            });
            if(tags.length != mentionedUsers.length){
                throw new BadRequestException("One or more mentioned users do not exist");
            }
            for(const tag of tags){
                const tokens = await this._redisService.getMemberFCMTokens(tag);
                if(tokens.length){
                    await this._notificationService.sendNotifications({
                        tokens,
                        data:{
                        title: "You were mentioned in a post",
                        body: "You were mentioned in a new post."
                        },
                    });
                }
            }
        }
    }
}


export default new PostService()