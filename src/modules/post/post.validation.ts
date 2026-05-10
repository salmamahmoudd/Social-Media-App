import z from "zod";
import { PostPrivcyEnum } from "../../common/enums/post.enums.js";
import { Types } from "mongoose";

export const createPostSchema = {
    body: z.object({
        content: z.string().min(3).max(1000).optional(),
        files: z.array(z.any()).optional(),
        tags: z.array(z.string()).optional(),
        privacy:z.coerce.number().default(PostPrivcyEnum.PUBLIC)
    }).superRefine((args, ctx)=>{
        if(!args.files?.length && !args.content){
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Either content or files must be provided",
            });
        }
        for(const tag of args.tags as string[]){
            if(!Types.ObjectId.isValid(tag)){
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: `Invalid tag id: ${tag}`,
                });
            }
        }
        const uniqueTags = [...new Set(args.tags)];
        if(uniqueTags.length != args.tags?.length){
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Tags must be unique",
            });
        }
    })
}

