import express, { Express, Router } from "express";
import passport from "passport";
import { DISABLE_SIGNUP, FORCE_LOGIN, IS_DEV, LDAP_OPTIONS, SESSION_SECRET } from "./config";
import path from "path";
import connectionEnsureLogin, { LoggedInOptions } from "connect-ensure-login";
import User, { createUser, findUserById, findUserByUsername, getUsername } from "./user";
import session from "express-session";
import { getId } from "./database";

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
}

function authErrorToString(error: AuthError): string {
    switch (error) {
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
    }
}

const router: Router = Router();
const sessionHandler: express.RequestHandler = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
});

setupRouter();

export function getAuthRouter(): Router {
    return router;
}

export function getSessionHandler(): express.RequestHandler {
    return sessionHandler;
}

function setupSignup(): void {
    router.post("/signup", connectionEnsureLogin.ensureLoggedOut(), (req, res, next) => {
        const username: string = req.body.username;
        const password: string[] = req.body.password;
        if (password.length !== 2 || password[0] !== password[1]) {
            req.session.signupError = AuthError.PASSWORDS_MISMATCH;
            return res.redirect("/auth/signup");
        }
        findUserByUsername(username)
            .then(user => {
                req.session.signupError = AuthError.NO_ERROR;
                if (user) {
                    req.session.signupError = AuthError.USERNAME_TAKEN;
                    return res.redirect("/auth/signup");
                }
                return createUser(username, password[0]).catch(() => {
                    req.session.signupError = AuthError.USER_CREATION_FAILED;
                    res.redirect("/auth/signup");
                });
            })
            .then(() => res.redirect("/auth/login"))
            .catch(() => {
                req.session.signupError = AuthError.UNKNOWN;
                res.redirect("/auth/signup");
            });
    });
    router.get("/signup", (req, res) =>
        res.render("pages/signup", {
            error: authErrorToString(req.session.signupError),
        })
    );
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
    router.get("/login", (req, res) =>
        res.render("pages/login", {
            error: authErrorToString(req.session.loginError),
            disableSignup: DISABLE_SIGNUP,
        })
    );
}

function setupLogout(): void {
    router.get("/logout", (req, res) => {
        req.logout();
        res.redirect("/");
    });
}

function setupRouter(): void {
    router.get("/auth.css", (req, res) => res.sendFile(path.join(process.cwd(), "public", "auth.css")));
    if (!DISABLE_SIGNUP) {
        setupSignup();
    }
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
            findUserByUsername(username)
                .then(user => {
                    if (!user || !user.checkPassword(password)) {
                        if (!user) {
                            console.debug(`No user found for username "${username}"`);
                        }
                        return done(null, false, { message: "Username or Password incorrect." });
                    }
                    return done(null, { id: getId(user), username: getUsername(user) });
                })
                .catch(error => done(error, null));
        })
    );
    passport.serializeUser((user: User, done) => done(null, getId(user)));
    passport.deserializeUser((id: string, done) =>
        findUserById(id)
            .then(user => done(null, user))
            .catch(error => done(error, null))
    );
}

export function setupAuth(app: Express): void {
    app.use(sessionHandler);
    if (LDAP_OPTIONS) {
        setupLDAPStrategy();
    } else {
        setupLocalStrategy();
    }
    app.use(passport.initialize());
    app.use(passport.session());
    if (IS_DEV && !FORCE_LOGIN) {
        app.use((req, res, next) => {
            req.isAuthenticated = () => true;
            next();
        });
    }
}
