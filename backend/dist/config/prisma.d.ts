import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient | undefined;
}
declare const prisma: any;
export declare const initializePrisma: () => Promise<void>;
export declare const disconnectPrisma: () => Promise<void>;
export declare const checkPrismaHealth: () => Promise<boolean>;
export { prisma };
export default prisma;
//# sourceMappingURL=prisma.d.ts.map