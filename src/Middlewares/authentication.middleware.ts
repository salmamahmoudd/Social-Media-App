import type { Request, Response, NextFunction } from "express";
import { TokenTypeEnum } from "../common/enums/token.enum.js";
import { BadRequestException, UnauthorizedException } from "../common/exceptions/domin.exception.js";
import tokenService from "../common/security/token.service.js";
import type { JwtPayload } from "jsonwebtoken";
import type { RoleEnum } from "../common/enums/user.enums.js";
import redisService from "../DB/Redis/redis.service.js";
import UserRepo from "../DB/Repo/user.repo.js";

export function authentication(tokenTypeParam = TokenTypeEnum.access){
    return async (req:Request,res:Response,next:NextFunction)=>{
        const { authorization } = req.headers;

        if(!authorization){
            throw new UnauthorizedException("You Need to login first")
        }

        const [BearerKey , token] = authorization.split(" ");

        if(BearerKey != "Bearer"){
            throw new BadRequestException("Invalid Bearer Key");
        }

        if(!token){
        throw new UnauthorizedException("You Need to login first")
        }

        const decodedToken = tokenService.decodeToken( token ) as JwtPayload;

        if(!decodedToken || !decodedToken.aud){
            throw new UnauthorizedException("Invalid Token");
        }

        const [userRole , tokenType] = decodedToken.aud;

        if(tokenType != tokenTypeParam){
            throw new BadRequestException("Invalid Token Type");
        }

        const {accessSignature , refreshSignature} = tokenService.getSignature(Number(userRole) as RoleEnum);

        const verifiedToken = tokenService.verifyToken({
            token : token,
            signature:
                tokenTypeParam == TokenTypeEnum.access
                ? accessSignature
                : refreshSignature,
        }) as JwtPayload;

        if(
        verifiedToken.jti && (
        await redisService.exists(
        redisService.getBlackListTokenKey({
            userId:verifiedToken.sub as string, 
            tokenId:verifiedToken.jti,
        })
        ))
    ){ 
        throw new UnauthorizedException("You need to login again");
        }

        const user = await UserRepo.findById({
            id: verifiedToken.sub as string,
        });

        if(!user){
            throw new UnauthorizedException("Account not found , Signup Again");
        }

        if(new Date(verifiedToken.iat! * 1000) < user.changeCreditTime){
            throw new UnauthorizedException("You need to login again")
        }
        req.user = user;
        req.tokenPayload = verifiedToken;
        next();
    }; 
}