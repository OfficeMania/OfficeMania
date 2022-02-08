import { ConfigEntry } from "./database/entity/config-entry";
import { LoginInfo, SignupInfo } from "../common";

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
const ALLOW_LOGIN_VIA_CREDENTIALS: boolean | undefined = toBoolean(process.env.ALLOW_LOGIN_VIA_CREDENTIALS);
const ALLOW_LOGIN_VIA_INVITE_CODE: boolean | undefined = toBoolean(process.env.ALLOW_LOGIN_VIA_INVITE_CODE);
const DISABLE_SIGNUP: boolean | undefined = toBoolean(process.env.DISABLE_SIGNUP);
const REQUIRE_INVITE_CODE_FOR_SIGNUP: boolean | undefined = toBoolean(process.env.REQUIRE_INVITE_CODE_FOR_SIGNUP);

export const LDAP_OPTIONS = null;

async function getStringOrElse(
    key: string,
    envValue: string | undefined,
    defaultValue: string,
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
    defaultValue: number,
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
    defaultValue: boolean,
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

const cacheLoginRequired: {
    timestamp?: Date,
    value?: boolean,
} = {};

export async function isLoginRequired(defaultValue = false): Promise<boolean> {
    const now: Date = new Date();
    if (cacheLoginRequired.value !== undefined && cacheLoginRequired.timestamp && (now.getTime() - cacheLoginRequired.timestamp.getTime()) < 1000) {
        return cacheLoginRequired.value;
    }
    const value: boolean = await getBooleanOrElse("REQUIRE_LOGIN", REQUIRE_LOGIN, defaultValue);
    cacheLoginRequired.value = value;
    cacheLoginRequired.timestamp = now;
    return value;
}

export function isLoginViaCredentialsAllowed(defaultValue = true): Promise<boolean> {
    //TODO Implement this
    return getBooleanOrElse("ALLOW_LOGIN_VIA_CREDENTIALS", ALLOW_LOGIN_VIA_CREDENTIALS, defaultValue);
}

const cacheLoginViaInviteCodeAllowed: {
    timestamp?: Date,
    value?: boolean,
} = {};

export async function isLoginViaInviteCodeAllowed(defaultValue = false): Promise<boolean> {
    //TODO Implement this
    const now: Date = new Date();
    if (cacheLoginViaInviteCodeAllowed.value !== undefined && cacheLoginViaInviteCodeAllowed.timestamp && (now.getTime() - cacheLoginViaInviteCodeAllowed.timestamp.getTime()) < 10000) {
        return cacheLoginViaInviteCodeAllowed.value;
    }
    const value: boolean = await getBooleanOrElse("ALLOW_LOGIN_VIA_INVITE_CODE", ALLOW_LOGIN_VIA_INVITE_CODE, defaultValue);
    cacheLoginViaInviteCodeAllowed.value = value;
    cacheLoginViaInviteCodeAllowed.timestamp = now;
    return value;
}

export function isSignupDisabled(defaultValue = true): Promise<boolean> {
    return getBooleanOrElse("DISABLE_SIGNUP", DISABLE_SIGNUP, defaultValue);
}

export function isInviteCodeRequiredForSignup(defaultValue = false): Promise<boolean> {
    return getBooleanOrElse("REQUIRE_INVITE_CODE_FOR_SIGNUP", REQUIRE_INVITE_CODE_FOR_SIGNUP, defaultValue);
}

export const CONFIG_KEYS: string[] = ["ENABLE_LOGIN", "REQUIRE_LOGIN", "ALLOW_LOGIN_VIA_CREDENTIALS", "ALLOW_LOGIN_VIA_INVITE_CODE", "DISABLE_SIGNUP", "REQUIRE_INVITE_CODE_FOR_SIGNUP"];
export const CONFIG_DEFAULT_VALUES: any[] = [false, false, true, false, true, false];

export function getEnvValue(key: string): string | undefined | null {
    if (!CONFIG_KEYS.includes(key)) {
        return undefined;
    }
    return process.env[key] ?? null;
}

export async function getValue(key: string): Promise<string | undefined | null> {
    if (!CONFIG_KEYS.includes(key)) {
        return undefined;
    }
    const configEntry: ConfigEntry | undefined = await ConfigEntry.findOne(key);
    if (!configEntry) {
        return getEnvValue(key);
    }
    return configEntry.value;
}

export async function getValueOrDefault(key: string): Promise<string | undefined> {
    const index: number = CONFIG_KEYS.indexOf(key);
    if (index < 0) {
        return undefined;
    }
    const defaultValue: any = CONFIG_DEFAULT_VALUES[index];
    return await getValue(key) ?? defaultValue;
}

export async function getLoginInfo(): Promise<LoginInfo> {
    return {
        isSignupDisabled: await isSignupDisabled(),
        isLoginViaCredentialsAllowed: await isLoginViaCredentialsAllowed(),
        isLoginViaInviteCodeAllowed: await isLoginViaInviteCodeAllowed(),
    };
}

export async function getSignupInfo(): Promise<SignupInfo> {
    return { isInviteCodeRequiredForSignup: await isInviteCodeRequiredForSignup() };
}
