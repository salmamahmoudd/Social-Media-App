import { createTransport } from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../../config/config.service.js";
import type { Attachment } from "nodemailer/lib/mailer/index.js";

const transport = createTransport({
    service: "gmail",
    auth:{
        user:EMAIL_USER,
        pass:EMAIL_PASS,
    },
})

async function sendMail({
    to, 
    subject, 
    text, 
    html, 
    attachments
}:{
    to: string | string[];
    subject: string;
    text?: string;
    html?:string;
    attachments?:Attachment[];
}) {
    const info = await transport.sendMail({
        from: `<${EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
    })
    console.log("Email Sended: ", info.messageId);
}

export default sendMail