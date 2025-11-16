import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
    };
}
interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}
export declare const generateTokens: (user: {
    id: string;
    email: string;
    username: string;
}) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyToken: (token: string, secret: string) => JWTPayload;
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const optionalAuthMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authRateLimit: (maxAttempts?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=auth.d.ts.map