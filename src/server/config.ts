/*
 * You can place general (server-)configurations here
 */
export const IS_DEV = process.env.NODE_ENV !== "production";
export const DEBUG: boolean = !!process.env.DEBUG;

export const SESSION_SECRET: string = process.env.SESSION_SECRET || "USE_A_SECURE_RANDOM_KEY_FOR_THE_SESSIONS";
export const BCRYPT_SALT_ROUNDS = 12;
export const PASSWORD_SECRET: string = process.env.PASSWORD_SECRET || "USE_A_SECURE_RANDOM_KEY_FOR_THE_PASSWORDS";

export const SERVER_PORT = Number(process.env.PORT) || 3000;
export const WEBPACK_PORT = 8085; // For dev environment only

// Which Database to use, defaults to sqlite
export const DB: string = process.env.DB || "sqlite";

// SQLite Database
export const DB_FILE: string | undefined = process.env.DB_FILE;

// PostgreSQL Database
export const DB_HOST: string | undefined = process.env.DB_HOST;
export const DB_PORT: number | undefined = toNumber(process.env.DB_PORT, 10);
export const DB_USERNAME: string | undefined = process.env.DB_USERNAME;
export const DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
export const DB_DATABASE: string | undefined = process.env.DB_DATABASE;

export const FORCE_LOGIN: boolean = toBoolean(process.env.FORCE_LOGIN) ?? false;
export const DISABLE_SIGNUP: boolean = toBoolean(process.env.DISABLE_SIGNUP) ?? true;
export const REQUIRE_INVITE_CODE: boolean = toBoolean(process.env.REQUIRE_INVITE_CODE) ?? false;

export const LDAP_OPTIONS = null;

function toNumber(input?: string, radix = 10): number | undefined {
    if (input === undefined || input === null) {
        return undefined;
    }
    return parseInt(input, radix);
}

function toBoolean(input?: string): boolean | undefined {
    if (input === undefined || input === null) {
        return undefined;
    }
    return !!input && input.toLowerCase() === "true";
}
