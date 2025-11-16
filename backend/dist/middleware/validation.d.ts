import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}
export declare const validate: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const commonSchemas: {
    id: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    username: Joi.StringSchema<string>;
    pagination: Joi.ObjectSchema<any>;
    debateFilters: Joi.ObjectSchema<any>;
    fileUpload: Joi.ObjectSchema<any>;
};
export declare const authSchemas: {
    register: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    refreshToken: Joi.ObjectSchema<any>;
    updateProfile: Joi.ObjectSchema<any>;
};
export declare const debateSchemas: {
    createSession: Joi.ObjectSchema<any>;
    updateSession: Joi.ObjectSchema<any>;
    getTopics: Joi.ObjectSchema<any>;
    getSession: Joi.ObjectSchema<any>;
};
export declare const learningSchemas: {
    updateProgress: Joi.ObjectSchema<any>;
    getModules: Joi.ObjectSchema<any>;
};
export declare const gamificationSchemas: {
    getLeaderboard: Joi.ObjectSchema<any>;
    awardPoints: Joi.ObjectSchema<any>;
};
export declare const uploadSchemas: {
    videoUpload: Joi.ObjectSchema<any>;
};
export declare const sanitize: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map