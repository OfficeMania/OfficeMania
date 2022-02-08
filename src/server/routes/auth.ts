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
