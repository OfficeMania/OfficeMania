import http from "http";
import express from "express";
import session from "express-session";
import cors from "cors";
import compression from "compression";
import path from "path";
import passport from "passport";
import { Server } from "colyseus";

import { TURoom } from "../common/rooms/turoom";
import { IS_DEV, LDAP_OPTIONS, SERVER_PORT, SESSION_SECRET } from "./config";
import User, { createUser, findUserById, isValidPassword } from "./user";

const LocalStrategy = require("passport-local").Strategy;
const LdapStrategy = require("passport-ldapauth").Strategy;

const flash = require("connect-flash");
const connectionEnsureLogin = require("connect-ensure-login");

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
            if (IS_DEV) {
                done(null, createUser(username, username));
                return;
            }
            const user: User = findUserById(username);
            if (!user) {
                done(null, false, { message: "Incorrect username." }); //TODO Later we don't want to report wrong username OR password, just that one of both was wrong
                return;
            }
            if (!isValidPassword(user, password)) {
                done(null, false, { message: "Incorrect password." }); //TODO Later we don't want to report wrong username OR password, just that one of both was wrong
            }
            done(null, user);
        })
    );
    passport.serializeUser((user: User, done) => done(null, user.username));
    passport.deserializeUser((id: string, done) => done(null, findUserById(id)));
}

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

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

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// Expose public directory
if (IS_DEV) {
    app.use("/", express.static("public"));
} else {
    app.use("/", connectionEnsureLogin.ensureLoggedIn(), express.static("public"));
}

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
app.use("/img", express.static(path.join(process.cwd(), "assets", "img"), { maxAge: 31536000000 }));

/*
 * "Mount" the assets/map directory under "[host]/map"
 */
app.use("/map", express.static(path.join(process.cwd(), "assets", "map")));

/*
 * "Mount" the assets/lib directory under "[host]/lib"
 */
app.use("/lib", express.static(path.join(process.cwd(), "assets", "lib"), { maxAge: 86400000 }));

/*
 * "Mount" the assets/templates directory under "[host]/templates"
 */
app.use("/templates", express.static(path.join(process.cwd(), "assets", "templates"), { maxAge: 31536000000 }));

/*
 * "Mount" the assets directory under "[host]/assets"
 */
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

/*
 * "Mount" the directory where the client JavaScript is generated to (dist/client)
 * under "[host]/img"
 *
 * In an HTML-document you can load the scripts via:
 *   <script src="/js/[script-name]"></script>
 */
app.use("/js", express.static(path.join(process.cwd(), "js", "client")));

// Register the TURoom (defined in src/common/rooms/turoom.ts)
gameServer.define("turoom", TURoom).enableRealtimeListing();

/*
 * Register colyseus monitor AFTER registering your room handlers
 *
 * See: https://docs.colyseus.io/tools/monitor/
 */
//app.use("/colyseus", monitor());

// Start the server
gameServer
    .listen(SERVER_PORT)
    .then(() => console.log(`Listening on http://localhost:${SERVER_PORT}`))
    .catch(console.error);
