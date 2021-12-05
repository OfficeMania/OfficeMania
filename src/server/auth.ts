import { Express, Router } from "express";
import passport from "passport";
import { DEBUG, DISABLE_SIGNUP, FORCE_LOGIN, IS_DEV, LDAP_OPTIONS, SESSION_SECRET } from "./config";
import path from "path";
import connectionEnsureLogin, { LoggedInOptions, LoggedOutOptions } from "connect-ensure-login";
import User, { createUser, findOrCreateUserByUsername, findUserById, findUserByUsername, getUsername } from "./user";
import session from "express-session";
import { connectDatabase, getId } from "./database";

const LocalStrategy = require("passport-local").Strategy;
const LdapStrategy = require("passport-ldapauth").Strategy;

export const loggedOutOptions: LoggedOutOptions = { redirectTo: "/auth/login" };
export const loggedInOptions: LoggedInOptions = { ...loggedOutOptions };

const router: Router = Router();

setupRouter();

export function getAuthRouter(): Router {
    return router;
}

function setupSignup(): void {
    router.post("/signup", connectionEnsureLogin.ensureLoggedOut(loggedOutOptions), (req, res, next) => {
        const username: string = req.body.username;
        const password: string[] = req.body.password;
        if (password.length !== 2 || password[0] !== password[1]) {
            return res.redirect("/login");
        }
        findUserByUsername(username).then(user => {
            if (user) {
                return;
            }
            return createUser(username, password[0]);
        });
        return res.redirect("/login");
    });
    router.get("/signup", (req, res) => res.sendFile(path.join(process.cwd(), "public", "signup.html")));
}

function setupLogin(): void {
    router.post(
        "/login",
        passport.authenticate(LDAP_OPTIONS ? "ldapauth" : "local", {
            successRedirect: "/",
            failureRedirect: "/login",
            failureFlash: true,
        })
    );
    router.get("/login.css", (req, res) => res.sendFile(path.join(process.cwd(), "public", "login.css")));
    router.get("/login", (req, res) => res.sendFile(path.join(process.cwd(), "public", "login.html")));
}

function setupLogout(): void {
    router.get("/logout", (req, res) => {
        req.logout();
        res.redirect("/");
    });
}

export function setupRouter(): void {
    if (!DISABLE_SIGNUP) {
        setupSignup();
    }
    setupLogin();
    setupLogout();
}

async function initDatabase(): Promise<void> {
    // TODO Remove this and use proper user creation etc.
    return findOrCreateUserByUsername("officemania", "sec-sep21-project").then(user => {
        if (!user) {
            console.error("Something went wrong when creating the default user");
        } else if (DEBUG) {
            console.debug(`Default user successfully found or created`);
        }
    });
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
                    if (!user || !user.compareSync(password)) {
                        if (!user) {
                            console.error(`No user found for username "${username}"`);
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
    app.use(
        session({
            secret: SESSION_SECRET,
            resave: false,
            saveUninitialized: true,
            cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
        })
    );
    connectDatabase()
        .then(() => initDatabase())
        .catch(console.error);
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
