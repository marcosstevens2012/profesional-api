import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export function requestIdMiddleware(headerName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header(headerName) || uuidv4();
    (req as any).requestId = requestId;
    res.setHeader(headerName, requestId);
    next();
  };
}
