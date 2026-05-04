import { compare, hash } from "bcrypt";
import { SALT_ROUND } from "../../config/config.service.js";

export async function hashOperation({
    plainText, 
    rounds = SALT_ROUND
}: {
    plainText: string,
    rounds?: number,
}) {
  return await hash (plainText, rounds)
}

export async function compareOperation({
    plainValue, 
    hashedValue,
}: {
    plainValue: string
    hashedValue: string,
}){
  return await compare(plainValue, hashedValue)
}

