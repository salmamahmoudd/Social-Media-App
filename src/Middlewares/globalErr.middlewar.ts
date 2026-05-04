import type { Request , Response , NextFunction} from "express";
interface IError extends Error{
    statusCode?:number,
}
function globalErrHandlingMiddleware(
        err:IError,
        req:Request,
        res:Response,
        next:NextFunction,
    ){
        res.
        status(err.statusCode || 500)
        .json({errMsg:err.message, stack: err.stack, err, cause:err.cause})
    }

export default globalErrHandlingMiddleware 