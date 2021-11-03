/*
 * You can place general (server-)configurations here
 */
export const IS_DEV = process.env.NODE_ENV !== 'production';

export const SESSION_SECRET = process.env.SESSION_SECRET || "USE_A_SECURE_RANDOM_KEY";

export const SERVER_PORT = Number(process.env.PORT) || 3000;
export const WEBPACK_PORT = 8085; // For dev environment only
