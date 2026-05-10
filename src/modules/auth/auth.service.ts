import { BadRequestException, ConflictException, NotFoundException } from "../../common/exceptions/domin.exception.js";
import { compareOperation, hashOperation } from "../../common/security/hash.js";
import tokenService from "../../common/security/token.service.js";
import mailService from "../../common/email/email.service.js";
import type { ConfirmEmailDto, LoginDto, ResetOTPForgetPasswordDto, SignupDto, VerifyOTPForgetPasswordDto } from "./auth.dto.js";
import { EmailTypeEnum } from "../../common/enums/email.enum.js";
import redisService from "../../DB/Redis/redis.service.js";
import userRepo from "../../DB/Repo/user.repo.js";
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID } from "../../config/config.service.js";
import { ProviderEnum } from "../../common/enums/user.enums.js";
import type { IHUser } from "../../DB/Models/User.Model.js";
import notificationService from "../../common/Notifiction/notifiction.service.js";

class AuthService {
    private _userRepo = userRepo
    private _tokenService = tokenService;
    private _mailService = mailService
    private _redisService = redisService
    private _notificationService = notificationService
    constructor() {}
public async signup(bodyData: SignupDto) {
      const { email } = bodyData
      const isEmail = await this._userRepo.findOne({filter:{email}})
      if(isEmail){
            throw new ConflictException("Email Already Exists")
        }
      const user = await this._userRepo.create({data:bodyData})
      await this._mailService.sendEmailOtp({
            email , 
            emailType: EmailTypeEnum.confirmEmail, 
            subject: "Confirm Your Email"
        })
        return user!;
}

public async login(body: LoginDto) {
   const { email, password } = body;
   const user = await this._userRepo.findOne({ 
    filter:{  email }
});
  if(!user) {
    throw new NotFoundException("Invalid info");
  }
  if(!user.confirmEmail) {
    throw new NotFoundException("You need to confirm your email first");
  }
  const isPasswordValid = await compareOperation({
    plainValue: password,
    hashedValue: user.password
  })
  if(!isPasswordValid){
    throw new NotFoundException("Invalid Info")
  }
  if(body.FCM){
    await this._redisService.addFCMTokenToSet(user._id, body.FCM)
    const tokens = await this._redisService.getMemberFCMTokens(user._id)
    await this._notificationService.sendNotifications({
      tokens,
      data: {
        title: "Login Notification",
        body: `You have successfully logged in to your account ${new Date()}`
      }
    })
  }
  return this._tokenService.generateAccessAndRefreshTokens(user)
}

async confirmEmail(bodyData: ConfirmEmailDto) {
  const { email, otp } = bodyData;

  const user = await this._userRepo.findOne({
    filter: {
        email, 
        confirmEmail:false
    }
  })

  if(!user){
    throw new BadRequestException("Invalid email or email already confirmed")
  }

  const storedOtp = await this._redisService.get(
    this._redisService.getOTPKey({
        email, 
        emailType : EmailTypeEnum.confirmEmail
    }),
)
  if(!storedOtp){
    throw new BadRequestException("OTP Expired")
  }

  const isOtpValid = await compareOperation({
    plainValue: otp,
    hashedValue: storedOtp,
  })

  if(!isOtpValid){
    throw new BadRequestException("OTP Not Valid")
  }

  user.confirmEmail = true
  await user.save()
}

async resendConfirmEmailOTP(email:string) {
 await this._mailService.sendEmailOtp({
    email , 
    emailType: EmailTypeEnum.confirmEmail, 
    subject: "Anthor OTP to Confirm Your Email"
});
}

async resendForgetPasswordOTP(email:string) {
 await this._mailService.sendEmailOtp({
  email , 
  emailType: EmailTypeEnum.forgetPassword, 
  subject: "Anthor OTP to Reset Your Password"
})
}

async sendOTPForgetPassword(email:string) {
  const user = await this._userRepo.findOne({
    filter: { email }
  })
  if(!user){
    return ;
  }
  if(!user.confirmEmail){
    throw new BadRequestException("Confirm your email first")
  }
 await this._mailService.sendEmailOtp({
  email , 
  emailType: EmailTypeEnum.forgetPassword, 
  subject: "Reset Your Password"
})
}

async verifyOTPForgetPassword(bodyData: VerifyOTPForgetPasswordDto) {
  const { email , otp } = bodyData;
  
  const emailOTP = await this._redisService.get(
    this._redisService.getOTPKey({
      email, 
      emailType:EmailTypeEnum.forgetPassword
}))

  if(!emailOTP){
    throw new BadRequestException("OTP Expired")
  }

  const isOtpValid = await compareOperation({
    plainValue: otp,
    hashedValue: emailOTP
  })
  
  if(!isOtpValid){
    throw new BadRequestException("OTP Not Valid")
  }
}

async resetPassword(bodyData:ResetOTPForgetPasswordDto) {
  const { email, password, otp } = bodyData;
  await this.verifyOTPForgetPassword({email, otp})
  await this._userRepo.updateOne({
    filter:{email},
    update:{password: await hashOperation({plainText:password})}})
}

async verifyGoogleToken(idToken:string){
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({ 
    idToken, 
    audience: GOOGLE_CLIENT_ID 
  });
  const payload = ticket.getPayload();
  return payload
}

async loginWithGoogle(idToken:string):Promise<{
    access_token: string;
    refresh_token: string
  }>{
  const payload = await this.verifyGoogleToken(idToken);

  if(!payload){
    throw new BadRequestException("Invalid Token Payload")
  }
  if(!payload!.email_verified) {
    throw new BadRequestException("Email must be verified")
  }
  const user = await this._userRepo.findOne({ 
  filter:{ email:payload.email as string , provider:ProviderEnum.Google 
  }});
  // if(!user){
  //   return this.signupWithGmail(idToken)
  // }
  return this._tokenService.generateAccessAndRefreshTokens(user as IHUser)
}

async signupWithGmail(idToken:string): Promise<{
  status: number
  result:{
    access_token: string;
    refresh_token: string
  }
  }>{
  const payloadGoogleToken = await this.verifyGoogleToken(idToken);
    if(!payloadGoogleToken){
    throw new BadRequestException("Invalid Token Payload")
  }
  if(!payloadGoogleToken.email_verified) {
    throw new BadRequestException("Email must be verified")
  }
  const user = await this._userRepo.findOne({ 
  filter:{ email:payloadGoogleToken.email as string }});
  if(user){
    if(user.provider == ProviderEnum.System){
      throw new BadRequestException("Account exists, login with email/password");
    }
    return {status:200 , result: await this.loginWithGoogle(idToken)};
  }
  const [newUser] = await this._userRepo.create({ 
    data:[{
    email: payloadGoogleToken.email,
    userName: payloadGoogleToken.name,
    profilePic: payloadGoogleToken.picture,
    confirmEmail: true,
    provider: ProviderEnum.Google
  }]});

  return { status:201, result: this._tokenService.generateAccessAndRefreshTokens(newUser!) };
}
}
export default new AuthService();