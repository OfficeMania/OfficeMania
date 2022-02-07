import { ConfigEntry } from "./database/entity/config-entry";

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

// Redis
export const REDIS_HOST: string | undefined = process.env.REDIS_HOST;
export const REDIS_PORT: number | undefined = toNumber(process.env.REDIS_PORT, 10);
export const REDIS_PASSWORD: string | undefined = process.env.REDIS_PASSWORD;

const ENABLE_LOGIN: boolean | undefined = toBoolean(process.env.ENABLE_LOGIN);
const REQUIRE_LOGIN: boolean | undefined = toBoolean(process.env.FORCE_LOGIN);
const ALLOW_LOGIN_VIA_INVITE_CODE: boolean | undefined = toBoolean(process.env.ALLOW_LOGIN_VIA_INVITE_CODE);
const DISABLE_SIGNUP: boolean | undefined = toBoolean(process.env.DISABLE_SIGNUP);
const REQUIRE_INVITE_CODE_FOR_SIGNUP: boolean | undefined = toBoolean(process.env.REQUIRE_INVITE_CODE_FOR_SIGNUP);

export const LDAP_OPTIONS = null;

async function getStringOrElse(
    key: string,
    envValue: string | undefined,
    defaultValue: string
): Promise<string> {
    const configEntry: ConfigEntry | undefined = await ConfigEntry.findOne(key);
    if (!configEntry) {
        return envValue ?? defaultValue;
    }
    return configEntry.value ?? defaultValue;
}

async function getNumberOrElse(
    key: string,
    envValue: number | undefined,
    defaultValue: number
): Promise<number> {
    const configEntry: ConfigEntry | undefined = await ConfigEntry.findOne(key);
    if (!configEntry) {
        return envValue ?? defaultValue;
    }
    return toNumber(configEntry.value) ?? defaultValue;
}

async function getBooleanOrElse(
    key: string,
    envValue: boolean | undefined,
    defaultValue: boolean
): Promise<boolean> {
    const configEntry: ConfigEntry | undefined = await ConfigEntry.findOne(key);
    if (!configEntry) {
        return envValue ?? defaultValue;
    }
    return toBoolean(configEntry.value) ?? defaultValue;
}

export function isLoginEnabled(defaultValue = false): Promise<boolean> {
    return getBooleanOrElse("ENABLE_LOGIN", ENABLE_LOGIN, defaultValue);
}

export function isLoginRequired(defaultValue = false): Promise<boolean> {
    return getBooleanOrElse("REQUIRE_LOGIN", REQUIRE_LOGIN, defaultValue);
}

export function isLoginViaInviteCodeAllowed(defaultValue = false): Promise<boolean> {
    return getBooleanOrElse("ALLOW_LOGIN_VIA_INVITE_CODE", ALLOW_LOGIN_VIA_INVITE_CODE, defaultValue);
}

export function isSignupDisabled(defaultValue = true): Promise<boolean> {
    return getBooleanOrElse("DISABLE_SIGNUP", DISABLE_SIGNUP, defaultValue);
}

export function isInviteCodeRequiredForSignup(defaultValue = false): Promise<boolean> {
    return getBooleanOrElse("REQUIRE_INVITE_CODE_FOR_SIGNUP", REQUIRE_INVITE_CODE_FOR_SIGNUP, defaultValue);
}
