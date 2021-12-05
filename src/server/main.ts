import http from "http";
import express, { Express } from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import { Server } from "colyseus";

import { TURoom } from "../common/rooms/turoom";
import { SERVER_PORT } from "./config";
import { getAuthRouter, loggedInOptions, setupAuth } from "./auth";
import connectionEnsureLogin from "connect-ensure-login";

const app: Express = express();

// Enable cors
app.use(cors());

// Enable body parsing
app.use(express.urlencoded({ extended: false }));

// Enable JSON-parsing / processing
app.use(express.json());

// Compress all responses
app.use(compression());

app.set("view engine", "ejs");

setupAuth(app);
app.use("/auth", getAuthRouter());

// Expose public directory
app.use("/", connectionEnsureLogin.ensureLoggedIn(loggedInOptions), express.static("public"));

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
    connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
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
    connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
    express.static(path.join(process.cwd(), "assets", "lib"), { maxAge: 86400000 })
);

/*
 * "Mount" the assets/templates directory under "[host]/templates"
 */
app.use(
    "/templates",
    connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
    express.static(path.join(process.cwd(), "assets", "templates"), { maxAge: 31536000000 })
);

/*
 * "Mount" the assets directory under "[host]/assets"
 */
app.use(
    "/assets",
    connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
    express.static(path.join(process.cwd(), "assets"))
);

/*
 * "Mount" the directory where the client JavaScript is generated to (dist/client)
 * under "[host]/img"
 *
 * In an HTML-document you can load the scripts via:
 *   <script src="/js/[script-name]"></script>
 */
app.use(
    "/js",
    connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
    express.static(path.join(process.cwd(), "js", "client"))
);

// Register the TURoom (defined in src/common/rooms/turoom.ts)
gameServer.define("turoom", TURoom).enableRealtimeListing();

/*
 * Register colyseus monitor AFTER registering your room handlers
 *
 * See: https://docs.colyseus.io/tools/monitor/
 */
//app.use("/colyseus", connectionEnsureLogin.ensureLoggedIn(loggedInOptions), ensureHasRole(Role.ADMIN), monitor()); //TODO Enable this and secure it via authentication/authorization

// Start the server
gameServer
    .listen(SERVER_PORT)
    .then(() => console.log(`Listening on http://localhost:${SERVER_PORT}`))
    .catch(console.error);
