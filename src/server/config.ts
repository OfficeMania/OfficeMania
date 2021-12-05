/*
 * You can place general (server-)configurations here
 */
export const IS_DEV = process.env.NODE_ENV !== "production";
export const DEBUG: boolean = !!process.env.DEBUG;

export const SESSION_SECRET: string = process.env.SESSION_SECRET || "USE_A_SECURE_RANDOM_KEY_FOR_THE_SESSIONS";

export const SERVER_PORT = Number(process.env.PORT) || 3000;
export const WEBPACK_PORT = 8085; // For dev environment only

export const BCRYPT_SALT_ROUNDS = 12;
export const PASSWORD_SECRET: string = process.env.PASSWORD_SECRET || "USE_A_SECURE_RANDOM_KEY_FOR_THE_PASSWORDS";

export const FORCE_LOGIN: boolean = !!process.env.FORCE_LOGIN;
export const DISABLE_SIGNUP = process.env.DISABLE_SIGNUP || true;

export const LDAP_OPTIONS = null;
