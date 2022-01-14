export const IS_DEV = process.env.NODE_ENV !== "production";
export const DEBUG: boolean = !!process.env.DEBUG;

export const BCRYPT_SALT_ROUNDS = 12;
export const PASSWORD_SECRET: string = process.env.PASSWORD_SECRET || "USE_A_SECURE_RANDOM_KEY_FOR_THE_PASSWORDS";
