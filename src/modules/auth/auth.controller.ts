import express from "express";
import AuthService from "./auth.service.js";
import successResponse from "../../common/response/success.response.js";
import { confirmEmailSchema, loginSchema, resendConfirmEmailSchema, resendForgetPasswordSchema, sendForgetPasswordSchema, signupSchema, signupWithGmailSchema, verifyOTPForgetPasswordSchema } from "./auth.validation.js";
import { validateSignup } from "../../Middlewares/validation.middleware.js";

const authController = express.Router();

authController.get("/", (req,res)=>{
    return successResponse({ res, message: "Auth route is working" });
})

authController.post("/signup", validateSignup(signupSchema), async (req, res) => {
    const result = await AuthService.signup(req.body);
    return successResponse<any>({ res, message: "Check Your Inbox" , data: result });
});

authController.post("/login",validateSignup(loginSchema), async (req, res) => {
    const result = await AuthService.login(req.body);
    return successResponse<{
        access_token:string;
        refresh_token:string;
    }>({ res, data: result });
});

authController.post("/confirm-email",validateSignup(confirmEmailSchema), async (req, res) => {
    await AuthService.confirmEmail(req.body);
    return successResponse({ res, message:"Email Confirmed" });
});

authController.post("/resend-confirm-email-otp",validateSignup(resendConfirmEmailSchema), async (req, res) => {
    await AuthService.resendConfirmEmailOTP(req.body.email);
    return successResponse({ res, message:"Check Your Inbox" });
});

authController.post("/send-forget-password-otp",validateSignup(sendForgetPasswordSchema), async (req, res) => {
    await AuthService.sendOTPForgetPassword(req.body.email);
    return successResponse({ res, message:"Check Your Inbox" });
});

authController.post("/resend-forget-password-otp",validateSignup(resendForgetPasswordSchema), async (req, res) => {
    await AuthService.resendForgetPasswordOTP(req.body.email);
    return successResponse({ res, message:"Check Your Inbox" });
});

authController.post(
  "/verify-forget-password-otp",
  validateSignup(verifyOTPForgetPasswordSchema),
  async (req, res) => {
    await AuthService.verifyOTPForgetPassword(req.body);
    return successResponse({ res });
  }
);

authController.post(
  "/reset-forget-password-otp",
  validateSignup(verifyOTPForgetPasswordSchema),
  async (req, res) => {
    await AuthService.resetPassword(req.body); 
    return successResponse({ res });
  }
);

authController.post(
  "/signup/gmail",
  validateSignup(signupWithGmailSchema),
  async (req, res) => {
    const result = await AuthService.signupWithGmail(req.body.idToken); 
    return successResponse<{
    status: number;
    result: {
        access_token: string;
        refresh_token: string;
    };
}>({ res, data:result });
  }
);
export default authController;