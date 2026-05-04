import type { EmailTypeEnum } from "../../common/enums/email.enum.js";
import { client } from "./redis.connection.js";
import type { ObjectId , Types} from "mongoose";

class RedisService{

getBlackListTokenKey({ 
    userId, 
    tokenId 
}:{
    userId: string | Types.ObjectId;
    tokenId: string;
}) {
  return `blackListToken::${userId}::${tokenId}`;
}

getOTPKey({ 
    email, 
    emailType 
}:{
    email: string; emailType: EmailTypeEnum
}) {
  return `OTP::${email}:${emailType}`;
}

getOTPReqNoKey({ 
    email, 
    emailType 
}:{
    email: string; 
    emailType: EmailTypeEnum
}) {
  return `OTP::${email}::${emailType}::No`;
}

getOTPBlockedKey({ 
    email, 
    emailType 
}:{
    email: string; 
    emailType: EmailTypeEnum
}) {
  return `OTP::${email}::${emailType}::Blocked`
}

 async set({ key, value, exType = "EX", exValue = 50 }:{
    key:string;
    value:string | number , 
    exType?: "EX" | "PX" | "EXAT" | "PXAT",
    exValue?: number;
 }) {
  return await client.set(key , value, {
  expiration:{ type:exType, value: Math.floor(exValue) }
})
}

 async  incr(key : string) {
  return await client.incr(key )
}

 async  decr(key  : string) {
  return await client.decr(key )
}

 async  update({ key, value }:{key:string, value:string | number}) {
  return await client.set(key, value);
}

 async  remove(key  : string | string[]) {
  return await client.del(key);
}

 async  ttl(key: string) {
  return await client.ttl(key);
}

 async  setExpire(key : string, seconds: number) {
  return await client.expire(key, seconds);
}

 async  removeExpire(key : string) {
  return await client.persist(key);
}

 async  get(key  : string) {
  return await client.get(key);
}

 async  mget(key  : string[]) {
  return await client.mGet(key);
}

 async  exists(key  : string) {
  return await client.exists(key);
}
}

export default new RedisService();