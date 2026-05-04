import type { Response } from "express";

function successResponse<T>({
    res,
    statusCode = 200,
    message = "Success",
    data,
}:{
    res:Response;
    statusCode?:number;
    message?:string;
    data?:T;
}){
    return res.status(statusCode).json({ message: "Done" , data});
}

export default successResponse;