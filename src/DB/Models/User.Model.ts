import { model, Schema, type HydratedDocument} from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums/user.enums.js";
import mailService from "../../common/email/email.service.js";
import { hashOperation } from "../../common/security/hash.js";
import { encryptValue } from "../../common/security/encrypt.js";
import { EmailTypeEnum } from "../../common/enums/email.enum.js";

export interface IUser{
    userName : string;
    email : string;
    password : string;
    provider : ProviderEnum;
    confirmEmail : boolean;
    profilePic: string;
    coverPics : string[];
    age: number;
    phone : string;
    gender: GenderEnum;
    role: RoleEnum;
    changeCreditTime: Date;
    deletedAt: Date,
}

export type IHUser = HydratedDocument<IUser>

const userSchema = new Schema<IUser>({
    userName : {
        type: String, 
        required: true
    },
    email : {
        type: String, 
        required: true
    },
    password : {
        type: String, 
        required: function():boolean{
        return this.provider == ProviderEnum.System;
    }},
    provider : {
        type: Number, 
        enum: ProviderEnum, 
        default: ProviderEnum.System
    },
    confirmEmail : {
        type: Boolean, 
        default: false
    },
    profilePic:  String,
    coverPics : [String],
    age: Number,
    gender: {
        type: Number, 
        enum: GenderEnum, 
        default: GenderEnum.Female
    },
    role: {
        type: Number, 
        enum: RoleEnum, 
        default: RoleEnum.User
    },
    phone: String,
    changeCreditTime: Date,
    deletedAt: Date,
},{
    timestamps: true,
    strictQuery:true,
}
)

userSchema.pre("save", async function(this:IHUser & { wasNew: boolean}){
    this.wasNew = this.wasNew
    if(this.isModified("password")){
        this.password = await hashOperation({
            plainText:this.password
        })
    }
    if(this.phone && this.isModified("phone")){
        const phoneEncrypted = encryptValue({
            value: this.phone
        })
        this.phone = phoneEncrypted
    }
})

userSchema.post("save", async function(this:IHUser & { wasNew: boolean}){
    try{
    if(this.wasNew){
        await mailService.sendEmailOtp({
            email:this.email,
            emailType:EmailTypeEnum.confirmEmail,
            subject:"Confirm Your Email"
        })
    }
    }catch(error){
        console.log(error);
        
    }
})

userSchema.pre(["findOne", "find"], function(){
    const query = this.getQuery()
    if(!query.getSoftDelete){
        this.setQuery({...query, deletedAt: {$exists: false}})
    }
})



const UserModel = model<IUser>("User", userSchema);

export default UserModel;