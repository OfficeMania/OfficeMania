import http from "http";
import express from "express";
import session from "express-session";
import cors from "cors";
import compression from "compression";
import path from "path";
import passport from "passport";
import { Server } from "colyseus";
import { compareSync, hashSync } from "bcrypt";
import sqlite3, { Database } from "sqlite3";

import { TURoom } from "../common/rooms/turoom";
import { DISABLE_SIGNUP, IS_DEV, LDAP_OPTIONS, SALT_ROUNDS, SERVER_PORT, SESSION_SECRET } from "./config";
import User from "./user";

const LocalStrategy = require("passport-local").Strategy;
const LdapStrategy = require("passport-ldapauth").Strategy;

const flash = require("connect-flash");
const connectionEnsureLogin = require("connect-ensure-login");

const database: Database = new sqlite3.Database("./database.sqlite");

const app = express();

// Enable cors
app.use(cors());

// Enable body parsing
app.use(express.urlencoded({ extended: false }));

// Enable JSON-parsing / processing
app.use(express.json());

// Compress all responses
app.use(compression());

// Use express sessions
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
    })
);

// Set passport strategy
if (LDAP_OPTIONS) {
    // Use LdapStrategy
    console.debug("Using LdapStrategy");
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
} else {
    // Use LocalStrategy
    console.debug("Using LocalStrategy");
    passport.use(
        new LocalStrategy(function (username, password, done) {
            database.get("SELECT id, username, password FROM user WHERE username = ?;", username, (err, user: User) => {
                if (!user || !compareSync(password, user.password)) {
                    if (!user) {
                        console.error(`no user found for "${username}"`);
                    }
                    return done(null, false, { message: "Username or Password incorrect." });
                }
                return done(null, { id: user.id, username: user.username });
            });
        })
    );
    passport.serializeUser((user: User, done) => done(null, user.id));
    passport.deserializeUser((id: string, done) => {
        database.get("SELECT id, username FROM user WHERE id = ?;", id, (err, user: User) => {
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        });
    });
}

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

if (IS_DEV) {
    app.use((req, res, next) => {
        req.isAuthenticated = () => true;
        next();
    });
}

app.post(
    "/login",
    passport.authenticate(LDAP_OPTIONS ? "ldapauth" : "local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true,
    })
);
app.get("/login.css", (req, res) => res.sendFile(path.join(process.cwd(), "public", "login.css")));
app.get("/login", (req, res) => res.sendFile(path.join(process.cwd(), "public", "login.html")));

if (!DISABLE_SIGNUP) {
    app.post("/signup", connectionEnsureLogin.ensureLoggedOut(), (req, res, next) => {
        const username: string = req.body.username;
        const password: string[] = req.body.password;
        if (password.length !== 2 || password[0] !== password[1]) {
            return next(new Error("Passwords do not match"));
        }
        database.get("SELECT id, username, password FROM user WHERE username = ?", username, (err, user: User) => {
            if (user) {
                return next(new Error("User already exists"));
            }
            const passwordHash: string = hashSync(password[0], SALT_ROUNDS);
            database.run("INSERT INTO user (username, password) VALUES (?, ?);", username, passwordHash);
            next();
        });
    });
    app.get("/signup", (req, res) => res.sendFile(path.join(process.cwd(), "public", "signup.html")));
}

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// Expose public directory
app.use("/", connectionEnsureLogin.ensureLoggedIn(), express.static("public"));

// Create game server
const gameServer = new Server({
    server: http.createServer(app),
    express: app,
    //pingInterval: 0, // Number of milliseconds for the server to "ping" the clients. Default: 3000
    // The clients are going to be forcibly disconnected if they can't respond after pingMaxRetries retries.
    // Maybe this solves the problem that you can't move after some time doing nothing on the website.
    //pingMaxRetries: 2, // Maximum allowed number of pings without a response. Default: 2.
});

// "Mount" the public folder as the root of the website
//app.use('/', serveIndex(path.join(process.cwd(), "public"), {'icons': true}));
//app.use('/', express.static(path.join(process.cwd(), "public")));

/*
 * "Mount" the assets/img directory under "[host]/img"
 *
 * In an HTML-document you can load the images via:
 *   <img src="/img/[image-name]" />
 */
app.use(
    "/img",
    connectionEnsureLogin.ensureLoggedIn(),
    express.static(path.join(process.cwd(), "assets", "img"), { maxAge: 31536000000 })
);

/*
 * "Mount" the assets/map directory under "[host]/map"
 */
app.use("/map", express.static(path.join(process.cwd(), "assets", "map")));

/*
 * "Mount" the assets/lib directory under "[host]/lib"
 */
app.use(
    "/lib",
    connectionEnsureLogin.ensureLoggedIn(),
    express.static(path.join(process.cwd(), "assets", "lib"), { maxAge: 86400000 })
);

/*
 * "Mount" the assets/templates directory under "[host]/templates"
 */
app.use(
    "/templates",
    connectionEnsureLogin.ensureLoggedIn(),
    express.static(path.join(process.cwd(), "assets", "templates"), { maxAge: 31536000000 })
);

/*
 * "Mount" the assets directory under "[host]/assets"
 */
app.use("/assets", connectionEnsureLogin.ensureLoggedIn(), express.static(path.join(process.cwd(), "assets")));

/*
 * "Mount" the directory where the client JavaScript is generated to (dist/client)
 * under "[host]/img"
 *
 * In an HTML-document you can load the scripts via:
 *   <script src="/js/[script-name]"></script>
 */
app.use("/js", connectionEnsureLogin.ensureLoggedIn(), express.static(path.join(process.cwd(), "js", "client")));

// Register the TURoom (defined in src/common/rooms/turoom.ts)
gameServer.define("turoom", TURoom).enableRealtimeListing();

/*
 * Register colyseus monitor AFTER registering your room handlers
 *
 * See: https://docs.colyseus.io/tools/monitor/
 */
//app.use("/colyseus", connectionEnsureLogin.ensureLoggedIn(), monitor()); //TODO Enable this and secure it via authentication/authorization

// Start the server
gameServer
    .listen(SERVER_PORT)
    .then(() => console.log(`Listening on http://localhost:${SERVER_PORT}`))
    .catch(console.error);
