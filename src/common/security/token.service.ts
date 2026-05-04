import { TokenTypeEnum } from "../enums/token.enum.js";
import { 
  TOKEN_SIGNATURE_Admin_ACCESS, 
  TOKEN_SIGNATURE_Admin_REFRESH, 
  TOKEN_SIGNATURE_User_ACCESS, 
  TOKEN_SIGNATURE_User_REFRESH } from "../../config/config.service.js";
import {randomUUID} from "crypto"
import { RoleEnum } from "../enums/user.enums.js";
import jwt, { type SignOptions } from "jsonwebtoken"
import type { IHUser, IUser } from '../../DB/Models/User.Model.js';

class TokenService{
  constructor(){}
  getSignature(role : RoleEnum= RoleEnum.User):{
    accessSignature:string;
    refreshSignature:string;
  } {
    let accessSignature ="";
    let refreshSignature = "";
      switch (role) {
        case RoleEnum.User:
        accessSignature = TOKEN_SIGNATURE_User_ACCESS;
        refreshSignature = TOKEN_SIGNATURE_User_REFRESH
        break;
        case RoleEnum.Admin:
        accessSignature = TOKEN_SIGNATURE_Admin_ACCESS;
        refreshSignature = TOKEN_SIGNATURE_Admin_REFRESH
        break;
    }
    return { accessSignature , refreshSignature }
}

generateToken({
    payload ={} ,
    signature , 
    options = {}
}:{
    payload?:string | object;
    signature:string;
    options?: SignOptions
}){
  return jwt.sign(payload, signature, options)
}
verifyToken({
    token , 
    signature
}:{
    token:string, 
    signature:string
}){
  return jwt.verify(token , signature)
}
decodeToken(token: string){
  return jwt.decode(token)
}
generateAccessAndRefreshTokens(user:IHUser){
  const { accessSignature , refreshSignature } = this.getSignature(user.role);

  const tokenId = randomUUID()

  const access_token = this.generateToken({ 
    signature: accessSignature, 
    options:{
      audience: [String(user.role) , TokenTypeEnum.access],
      expiresIn: 60 * 15,
      subject: user._id.toString(),
      jwtid: tokenId,
    },
  });

  const refresh_token = this.generateToken({ 
    signature: refreshSignature, 
    options:{
      audience:[String(user.role)  , TokenTypeEnum.refresh],
      expiresIn: "1y",
      subject:user._id.toString(),
      jwtid: tokenId,
    }, 
  });

  return { access_token , refresh_token }
}
}

export default new TokenService();