import redisService from "../../DB/Redis/redis.service.js";
import type { EmailTypeEnum } from "../enums/email.enum.js";
import { BadRequestException } from "../exceptions/domin.exception.js";
import { generateOTP } from "../OTP/otp.service.js";
import { hashOperation } from "../security/hash.js";
import sendMail from "./email.config.js";
class MailService{
    private _redisMethods = redisService;
    constructor(){}
    async sendEmailOtp({
        email, 
        emailType, 
        subject
    }:{
        email: string;
        emailType: EmailTypeEnum;
        subject: string;
}){
  const pervOtpTTL = await this._redisMethods.ttl(
      this._redisMethods.getOTPKey({
        email, 
        emailType
    }),
  );

  if (pervOtpTTL > 0) {
    throw new BadRequestException(
      `There is already OTP valid for ${pervOtpTTL} seconds`
    );
  }

  const isBlocked = await this._redisMethods.exists(
     this._redisMethods.getOTPBlockedKey({ 
        email, 
        emailType
    }),
  )

  if(isBlocked){
    throw new BadRequestException(`Try again later`)
  }

  const reqNo = await this._redisMethods.get(
    this._redisMethods.getOTPReqNoKey({
        email, 
        emailType
    }))

  if(Number(reqNo) == 5){
    await this._redisMethods.set({
    key: this._redisMethods.getOTPBlockedKey({ 
    email, 
    emailType
}),
    value: 1,
    exValue: 10 * 60,
  });
      throw new BadRequestException(
      `You cannot request more than 5 emails in 20m`
    );
  }

  const otp = generateOTP();
  await sendMail({
    to: email,
    subject,
    html: `<h1>Your OTP ${otp}</h1>`,
  });

  await this._redisMethods.set({
    key:this._redisMethods.getOTPKey({
        email, 
        emailType 
    }),
    value: await hashOperation({ 
        plainText: otp.toString() 
    }),
    exValue: 120,
  });

 await this._redisMethods.incr(
    this._redisMethods.getOTPReqNoKey({
        email, 
        emailType
    }))
}
}

export default new MailService();