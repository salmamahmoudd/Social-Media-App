import type { ObjectId } from "mongoose";
import DBRepo from "./db.repo.js";
import type { IPost } from "../Models/Post.model.js";
import postModel from "../Models/Post.model.js";

class PostRepo extends DBRepo<IPost>{
    constructor(){
    super(postModel)
}

}
export default new PostRepo();  
