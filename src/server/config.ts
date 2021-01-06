/*
 * You can place general (server-)configurations here
 */
const IS_DEV = process.env.NODE_ENV !== 'production';

const SERVER_PORT = Number(process.env.PORT) || 3000;
const WEBPACK_PORT = 8085; // For dev environment only

export { IS_DEV, SERVER_PORT, WEBPACK_PORT };