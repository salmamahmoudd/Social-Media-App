import { model, Schema, Types, type HydratedDocument } from "mongoose";
import { PostPrivcyEnum } from "../../common/enums/post.enums.js";

export interface IPost {
    content: string;
    attachments?:string;

    likes?: Types.ObjectId[];
    tags?: Types.ObjectId[];

    privacy: PostPrivcyEnum;
    createBy: Types.ObjectId;
    deletedAt: Date;
}

export type HIPost = HydratedDocument<IPost>

const postSchema = new Schema<IPost>(
    {
    content: { type: String , required: function(): boolean {
        return !this.attachments?.length },
    },
    attachments:[String],

    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],

    privacy: {
        type: Number,
        enum: PostPrivcyEnum,
        default: PostPrivcyEnum.PUBLIC
    },
    createBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: Date,
    },
    {
        timestamps: true,
    },
)

postSchema.pre(["find", "findOne"], function() {
    const query = this.getQuery();
    if(!query.getSoftDelete) {
        this.setQuery({ ...query, deletedAt: { $exists: false } })
    }
})

const postModel = model<IPost>("Post", postSchema);

export default postModel;