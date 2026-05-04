import z from "zod";

export const logoutSchema = {
    body:z.object({
        logoutOption: z.enum(["all", "one"])
    })
}

export const uploadProfilePicSchema = {
    body:z.object({
        originalname: z.string(),
        contentType: z.string(),
    })
}