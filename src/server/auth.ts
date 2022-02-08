import express, { Express, Router } from "express";
import passport from "passport";
import {
    IS_DEV,
    isInviteCodeRequiredForSignup,
    isLoginEnabled,
    isLoginRequired,
    isSignupDisabled,
    LDAP_OPTIONS,
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    SESSION_SECRET,
} from "./config";
import path from "path";
import { LoggedInOptions } from "connect-ensure-login";
import { createUser, User } from "./database/entity/user";
import session from "express-session";
import { InviteCode } from "./database/entity/invite-code";
import Redis from "ioredis";
import connect_redis from "connect-redis";

const RedisStore = connect_redis(session);

const LocalStrategy = require("passport-local").Strategy;
const LdapStrategy = require("passport-ldapauth").Strategy;

declare module "express-session" {
    interface Session {
        user: User;
        loginError: number;
        signupError: number;
    }
}

export const loggedInOptions: LoggedInOptions = { redirectTo: "/auth/login" };

enum AuthError {
    UNKNOWN = -1,
    NO_ERROR,
    USERNAME_TAKEN,
    USER_CREATION_FAILED,
    PASSWORDS_MISMATCH,
    INVALID_CREDENTIALS,
    INVITE_CODE_REQUIRED,
    INVALID_INVITE_CODE,
    INVITE_CODE_EXPIRED,
}

function authErrorToString(error: AuthError): string {
    switch (error) {
        default:
        case AuthError.UNKNOWN:
            return "Unknown Error";
        case AuthError.NO_ERROR:
            return undefined;
        case AuthError.USERNAME_TAKEN:
            return "The Username is already taken";
        case AuthError.USER_CREATION_FAILED:
            return "User creation failed";
        case AuthError.PASSWORDS_MISMATCH:
            return "Passwords do not match";
        case AuthError.INVALID_CREDENTIALS:
            return "Invalid Credentials";
        case AuthError.INVITE_CODE_REQUIRED:
            return "Invite Code required";
        case AuthError.INVALID_INVITE_CODE:
            return "Invalid Invite Code";
        case AuthError.INVITE_CODE_EXPIRED:
            return "Invite Code expired";
    }
}

const router: Router = Router();
let sessionHandler: express.RequestHandler = undefined;

setupRouter();

export function getAuthRouter(): Router {
    return router;
}

export function getSessionHandler(): express.RequestHandler {
    return sessionHandler;
}

function createDefaultSessionHandler(): express.RequestHandler {
    return session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
    });
}

function createRedisSessionHandler(): express.RequestHandler {
    const redisClient = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT || 6379,
        password: REDIS_PASSWORD,
    });
    redisClient.on("error", console.error);
    return session({
        store: new RedisStore({ client: redisClient }),
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: !IS_DEV, maxAge: 60 * 60 * 1000 }, // 1 hour
    });
}

function setupSessionHandler(): void {
    if (REDIS_HOST) {
        console.debug("Setup Redis Session Store");
        sessionHandler = createRedisSessionHandler();
    } else {
        console.debug("Setup In-Memory Session Store");
        sessionHandler = createDefaultSessionHandler();
    }
}

function setupSignup(): void {
    router.post("/signup", async (req, res) => {
        if (await isSignupDisabled()) {
            return res.sendStatus(404);
        }
        const username: string = req.body.username;
        const password: string[] = req.body.password;
        const inviteCodeString: string | undefined = req.body["invite-code"];
        if (password.length !== 2 || password[0] !== password[1]) {
            return res.status(500).send({
                error: AuthError.PASSWORDS_MISMATCH,
                errorMessage: authErrorToString(AuthError.PASSWORDS_MISMATCH),
            });
        }
        if ((await isInviteCodeRequiredForSignup()) && !inviteCodeString) {
            return res.status(500).send({
                error: AuthError.INVITE_CODE_REQUIRED,
                errorMessage: authErrorToString(AuthError.INVITE_CODE_REQUIRED),
            });
        } else if (inviteCodeString) {
            const inviteCode: InviteCode | undefined = await InviteCode.findOne({ where: { code: inviteCodeString } });
            if (!inviteCode) {
                return res.status(500).send({
                    error: AuthError.INVALID_INVITE_CODE,
                    errorMessage: authErrorToString(AuthError.INVALID_INVITE_CODE),
                });
            }
            if (inviteCode.usagesLeft === 0) {
                return res.status(500).send({
                    error: AuthError.INVITE_CODE_EXPIRED,
                    errorMessage: authErrorToString(AuthError.INVITE_CODE_EXPIRED),
                });
            }
            inviteCode.usages++;
            if (inviteCode.usagesLeft > 0) {
                inviteCode.usagesLeft--;
            }
            await inviteCode.save();
        }
        User.findOne({ where: { username } })
            .then(user => {
                if (user) {
                    return { user: undefined, error: AuthError.USERNAME_TAKEN };
                }
                return createUser(username, password[0]).then(user => ({ user })).catch(reason => {
                    console.error(reason);
                    return {
                        user: undefined,
                        error: AuthError.USER_CREATION_FAILED,
                        errorMessage: IS_DEV ? JSON.stringify(reason) : authErrorToString(AuthError.USER_CREATION_FAILED),
                    };
                });
            })
            .then((wrapper: { user?: User, error?: AuthError, errorMessage?: string }) => {
                const user: User | undefined = wrapper.user;
                const error: AuthError | undefined = wrapper.error;
                const errorMessage: string | undefined = wrapper.errorMessage;
                if (error) {
                    return res.status(500).send({ error, errorMessage: errorMessage ?? authErrorToString(error) });
                }
                if (user) {
                    return res.send({ user });
                } else {
                    res.status(500).send({
                        error: AuthError.UNKNOWN,
                        errorMessage: authErrorToString(AuthError.UNKNOWN),
                    });
                }
            })
            .catch(reason => {
                console.error(reason);
                res.status(500).send({
                    error: AuthError.UNKNOWN,
                    errorMessage: IS_DEV ? JSON.stringify(reason) : authErrorToString(AuthError.UNKNOWN),
                });
            });
    });
    router.get("/signup", async (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.redirect("/");
        }
        if (await isSignupDisabled()) {
            return res.redirect("/auth/login");
        }
        res.sendFile(path.join(process.cwd(), "public", "signup.html"));
    });
}

function setupLogin(): void {
    router.post("/login", async (req, res, next) => {
        if (!(await isLoginEnabled())) {
            return res.sendStatus(404);
        }
        passport.authenticate(LDAP_OPTIONS ? "ldapauth" : "local", (error, user, info) => {
            if (error) {
                return res.status(500).send({
                    error: AuthError.UNKNOWN,
                    errorMessage: IS_DEV ? JSON.stringify(error) : authErrorToString(AuthError.UNKNOWN),
                });
            }
            if (!user) {
                return res.status(500).send({
                    error: AuthError.INVALID_CREDENTIALS,
                    errorMessage: authErrorToString(AuthError.INVALID_CREDENTIALS),
                });
            }
            req.logIn(user, function(error) {
                if (error) {
                    return res.status(500).send({
                        error: AuthError.UNKNOWN,
                        errorMessage: IS_DEV ? JSON.stringify(error) : authErrorToString(AuthError.UNKNOWN),
                    });
                }
                return res.send({ user });
            });
        })(req, res, next);
    });
    router.get("/login", async (req, res) => {
            if (req.isAuthenticated && req.isAuthenticated()) {
                return res.redirect("/");
            }
            if (!(await isLoginEnabled())) {
                return res.redirect("/");
            }
            res.sendFile(path.join(process.cwd(), "public", "login.html"));
        },
    );
}

function setupLogout(): void {
    router.get("/logout", (req, res) => {
        req.logout();
        req.session.destroy(() => {
            if (!req.query.returnTo) {
                return res.redirect("/");
            }
            const pathname = "/auth/login";
            // @ts-ignore
            const urlParameters = new URLSearchParams({
                returnTo: req.query.returnTo,
            });
            res.redirect(`${pathname}?${urlParameters}`);
        });
    });
}

function setupRouter(): void {
    router.get("/auth.css", (req, res) => res.sendFile(path.join(process.cwd(), "public", "auth.css")));
    setupSignup();
    setupLogin();
    setupLogout();
}

function setupLDAPStrategy(): void {
    //TODO This needs to be worked on
    console.debug("Setup Passport with LdapStrategy");
    passport.use(
        new LdapStrategy(LDAP_OPTIONS, (user, done) => {
            done(null, user);
        }),
    );
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}

function setupLocalStrategy(): void {
    console.debug("Setup Passport with LocalStrategy");
    passport.use(
        new LocalStrategy(function(username, password, done) {
            User.findOne({ where: { username } })
                .then(user => {
                    if (!user || !user.checkPassword(password)) {
                        if (!user) {
                            console.debug(`No user found for username "${username}"`);
                        }
                        return done(null, false, { message: "Username or Password incorrect." });
                    }
                    return done(null, { id: user.id, username: user.username });
                })
                .catch(error => done(error, null));
        }),
    );
    passport.serializeUser((user: User, done) => done(null, user.id));
    passport.deserializeUser((id: string, done) =>
        User.findOne(id)
            .then(user => done(null, user))
            .catch(error => done(error, null)),
    );
}

const ensureSession: express.RequestHandler = (req, res, next) => {
    let tries = 3;

    function lookupSession(error?: any): void {
        if (error) {
            return next(error);
        }
        tries--;
        if (req.session) {
            return next();
        }
        if (tries < 0) {
            return next(new Error("Session is missing"));
        }
        sessionHandler(req, res, lookupSession);
    }

    lookupSession();
};

export async function setupAuth(app: Express): Promise<void> {
    setupSessionHandler();
    app.use(sessionHandler);
    app.use(ensureSession);
    if (LDAP_OPTIONS) {
        setupLDAPStrategy();
    } else {
        setupLocalStrategy();
    }
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(async (req, res, next) => {
        if (!(await isLoginRequired())) {
            req.isAuthenticated = () => true;
        }
        next();
    });
}
