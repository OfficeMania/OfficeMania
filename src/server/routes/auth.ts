import express, { Express, Router } from "express";
import passport from "passport";
import {
    IS_DEV,
    isLoginRequired,
    LDAP_OPTIONS,
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    SESSION_SECRET,
} from "../config";
import { LoggedInOptions } from "connect-ensure-login";
import { User } from "../database/entity/user";
import session from "express-session";
import Redis from "ioredis";
import connect_redis from "connect-redis";
import { getAuthLoginRouter } from "./auth/login";
import { getAuthSignupRouter } from "./auth/signup";
import { generateUUIDv4, InviteCodeToken } from "../../common";
import { InviteCode } from "../database/entity/invite-code";

const RedisStore = connect_redis(session);

const LocalStrategy = require("passport-local").Strategy;
const LdapStrategy = require("passport-ldapauth").Strategy;

declare module "express-session" {
    interface Session {
        user: User;
        loginError: number;
        signupError: number;
        inviteCodeToken?: string;
    }
}

export const loggedInOptions: LoggedInOptions = { redirectTo: "/auth/login" };

const router: Router = Router();
let sessionHandler: express.RequestHandler = undefined;

setupRouter();

export function getAuthRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.use("/login", getAuthLoginRouter());
    router.use("/signup", getAuthSignupRouter());
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

let INVITE_CODE_TOKENS: InviteCodeToken[] = [];

const INVITE_CODE_TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour

function isInviteCodeTokenValid(inviteCodeTokenString: string | undefined): boolean {
    if (!inviteCodeTokenString) {
        return false;
    }
    const inviteCodeTokens: InviteCodeToken[] = INVITE_CODE_TOKENS.filter(inviteCodeToken => inviteCodeToken.token === inviteCodeTokenString);
    if (inviteCodeTokens.length === 0) {
        return false;
    }
    const inviteCodeToken: InviteCodeToken = inviteCodeTokens[0];
    inviteCodeToken.lastUsed = new Date();
    return true;
}

function evictInviteCodeTokens(): void {
    const now: Date = new Date();
    INVITE_CODE_TOKENS = INVITE_CODE_TOKENS.filter(inviteCodeToken => !(inviteCodeToken.lastUsed && (now.getTime() - inviteCodeToken.lastUsed.getTime()) > INVITE_CODE_TOKEN_LIFETIME));
}

export function generateInviteCodeToken(): InviteCodeToken {
    const inviteCodeToken: InviteCodeToken = {
        token: generateUUIDv4(),
        created: new Date(),
    };
    INVITE_CODE_TOKENS.push(inviteCodeToken);
    return inviteCodeToken;
}

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
        if (!(await isLoginRequired()) || isInviteCodeTokenValid(req.session.inviteCodeToken)) {
            req.isAuthenticated = () => true;
        }
        next();
    });
    setInterval(() => evictInviteCodeTokens(), 60 * 1000);
}
