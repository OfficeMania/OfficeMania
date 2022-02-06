import express, { Express, Router } from "express";
import passport from "passport";
import {
    IS_DEV,
    isInviteCodeRequired,
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
            req.session.signupError = AuthError.PASSWORDS_MISMATCH;
            return res.redirect("/auth/signup");
        }
        if ((await isInviteCodeRequired()) && !inviteCodeString) {
            req.session.signupError = AuthError.INVITE_CODE_REQUIRED;
            return res.redirect("/auth/signup");
        } else if (inviteCodeString) {
            const inviteCode: InviteCode | undefined = await InviteCode.findOne({ where: { code: inviteCodeString } });
            if (!inviteCode) {
                req.session.signupError = AuthError.INVALID_INVITE_CODE;
                return res.redirect("/auth/signup");
            }
            if (inviteCode.usagesLeft === 0) {
                req.session.signupError = AuthError.INVITE_CODE_EXPIRED;
                return res.redirect("/auth/signup");
            }
            inviteCode.usages++;
            if (inviteCode.usagesLeft > 0) {
                inviteCode.usagesLeft--;
            }
            await inviteCode.save();
        }
        User.findOne({ where: { username } })
            .then(user => {
                req.session.signupError = AuthError.NO_ERROR;
                if (user) {
                    req.session.signupError = AuthError.USERNAME_TAKEN;
                    return;
                }
                return createUser(username, password[0]).catch(reason => {
                    console.error(reason);
                    req.session.signupError = AuthError.USER_CREATION_FAILED;
                });
            })
            .then((user: User) => {
                if (user) {
                    req.session.loginError = AuthError.NO_ERROR;
                    res.redirect("/auth/login");
                } else {
                    res.redirect("/auth/signup");
                }
            })
            .catch(reason => {
                console.error(reason);
                req.session.signupError = AuthError.UNKNOWN;
                res.redirect("/auth/signup");
            });
    });
    router.get("/signup", async (req, res) => {
        if (await isSignupDisabled()) {
            return res.redirect("/auth/login");
        }
        res.render("pages/signup", {
            error: authErrorToString(req.session.signupError),
            requireInviteCode: await isInviteCodeRequired(),
        });
    });
}

function setupLogin(): void {
    router.post("/login", (req, res, next) => {
        passport.authenticate(LDAP_OPTIONS ? "ldapauth" : "local", (error, user, info) => {
            if (error) {
                req.session.loginError = AuthError.UNKNOWN;
                return res.redirect("/auth/login");
            }
            if (!user) {
                req.session.loginError = AuthError.INVALID_CREDENTIALS;
                return res.redirect("/auth/login");
            }
            req.logIn(user, function (error) {
                if (error) {
                    req.session.loginError = AuthError.UNKNOWN;
                    return res.redirect("/auth/login");
                }
                req.session.loginError = AuthError.NO_ERROR;
                return res.redirect("/");
            });
        })(req, res, next);
    });
    router.get("/login", async (req, res) =>
        res.render("pages/login", {
            error: authErrorToString(req.session.loginError),
            disableSignup: await isSignupDisabled(),
        })
    );
}

function setupLogout(): void {
    router.get("/logout", (req, res) => {
        req.logout();
        req.session.destroy(() => res.redirect("/"));
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
        })
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
        new LocalStrategy(function (username, password, done) {
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
        })
    );
    passport.serializeUser((user: User, done) => done(null, user.id));
    passport.deserializeUser((id: string, done) =>
        User.findOne(id)
            .then(user => done(null, user))
            .catch(error => done(error, null))
    );
}

export async function setupAuth(app: Express): Promise<void> {
    setupSessionHandler();
    app.use(sessionHandler);
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
