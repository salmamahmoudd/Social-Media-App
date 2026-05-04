import type z from "zod";
import type { confirmEmailSchema, loginSchema, resetOTPForgetPasswordSchema, sendForgetPasswordSchema, signupSchema, verifyOTPForgetPasswordSchema } from "./auth.validation.js";

export type SignupDto = z.infer<typeof signupSchema.body>;
export type LoginDto = z.infer<typeof loginSchema.body>;
export type ConfirmEmailDto = z.infer<typeof confirmEmailSchema.body>;
export type SendForgetPasswordDto = z.infer<typeof sendForgetPasswordSchema.body>;
export type VerifyOTPForgetPasswordDto = z.infer<typeof verifyOTPForgetPasswordSchema.body>;
export type ResetOTPForgetPasswordDto = z.infer<typeof resetOTPForgetPasswordSchema.body>;
