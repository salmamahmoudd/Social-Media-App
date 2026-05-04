import CryptoJS from "crypto-js";
import { ENCRYPTION_KEY } from "../../config/config.service.js";
export function encryptValue({
    value , 
    key = ENCRYPTION_KEY
}:{
    value:string; 
    key?:string
}){
    return CryptoJS.AES.encrypt(value , key).toString();
}
export function decryptValue({
    ciphertext , 
    key = ENCRYPTION_KEY,
}: {
    ciphertext: string;
    key?: string;
}){
const bytes = CryptoJS.AES.decrypt(ciphertext, key);
const originalText = bytes.toString(CryptoJS.enc.Utf16)
return originalText
}