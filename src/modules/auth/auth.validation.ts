import z from "zod";
import { commonValidationFields } from "../../Middlewares/validation.middleware.js";

export const loginSchema = {
        body: z
        .strictObject({
            email: commonValidationFields.email,
            password: commonValidationFields.password,
        })
};

export const signupSchema = {
        body: loginSchema.body
        .extend({
            userName: commonValidationFields.userName,
            confirmPassword: z.string(),
            email: commonValidationFields.email,
            age: commonValidationFields.age.optional(),
            gender: commonValidationFields.gender.optional(),
            phone: commonValidationFields.phone.optional(),
        })
        .refine((data)=>{
            return data.confirmPassword === data.password;
        },
        {
            error: "Password and confirm password do not match",
        }
    )
};

export const confirmEmailSchema = {
    body:z.object({
        email:commonValidationFields.email,
        otp:commonValidationFields.otp,
    })
};

export const resendConfirmEmailSchema = {
    body:z.object({
        email:commonValidationFields.email,
    })
};

export const sendForgetPasswordSchema = {
    body:z.object({
        email:commonValidationFields.email,
    })
};

export const resendForgetPasswordSchema = {
    body:z.object({
        email:commonValidationFields.email,
    })
};

export const verifyOTPForgetPasswordSchema = {
    body:z.object({
        email:commonValidationFields.email,
        otp:commonValidationFields.otp,
    })
};

export const resetOTPForgetPasswordSchema = {
    body: verifyOTPForgetPasswordSchema.body.extend({
        password: commonValidationFields.password,
    })
};

export const signupWithGmailSchema = {
    body: z.object({
        idToken: z.string(),
    })
};
