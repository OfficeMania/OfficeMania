import "reflect-metadata";

import http from "http";
import express, { Express } from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import { Server } from "colyseus";

import { TURoom } from "./rooms/turoom";
import { DEBUG, IS_DEV, SERVER_PORT } from "./config";
import { getAuthRouter, getSessionHandler, loggedInOptions, setupAuth } from "./auth";
import connectionEnsureLogin from "connect-ensure-login";
import { ensureHasRole, findOrCreateUserByUsername, PasswordVersion, Role } from "./database/entity/user";
import { connectDatabase } from "./database/database";
import { getApiRouter } from "./api";
import { monitor } from "@colyseus/monitor";

export function ensureLoggedIn(setReturnTo = true): express.RequestHandler {
    const pathname = "/auth/login";
    return function(req, res, next) {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            if (!setReturnTo) {
                return res.redirect(pathname);
            }
            // @ts-ignore
            const urlParameters = new URLSearchParams({
                returnTo: req.originalUrl || "/",
            });
            return res.redirect(`${pathname}?${urlParameters}`);
        }
        next();
    }
}

async function initDatabase(): Promise<void> {
    // TODO Remove this and use proper user creation etc.
    for (let i = 0; i < 10; i++) {
        const name = `test${i}`;
        await findOrCreateUserByUsername(name, name, PasswordVersion.PLAIN);
    }
    await findOrCreateUserByUsername("admin", "admin", PasswordVersion.PLAIN, Role.ADMIN);
    return findOrCreateUserByUsername("officemania", "sec-sep21-project").then(user => {
        if (!user) {
            console.error("Something went wrong when creating the default user");
        } else if (DEBUG) {
            console.debug(`Default user successfully found or created`);
        }
    });
}

async function setupApp(): Promise<Express> {
    const app: Express = express();

    // Enable cors
    app.use(cors());

    // Enable body parsing
    app.use(express.urlencoded({ extended: false }));

    // Enable JSON-parsing / processing
    app.use(express.json());

    // Compress all responses
    app.use(compression());

    app.set("trust proxy", 1);

    app.set("view engine", "ejs");

    await connectDatabase(IS_DEV)
        .then(() => initDatabase())
        .catch(console.error);

    await setupAuth(app);
    app.use("/auth", getAuthRouter());

    app.use(
        "/api",
        (req, res, next) => {
            if (!req.isAuthenticated || !req.isAuthenticated()) {
                return res.sendStatus(401);
            }
            next();
        },
        getApiRouter()
    );

    // Expose public directory
    app.use("/", connectionEnsureLogin.ensureLoggedIn(loggedInOptions), express.static("public"));

    // Expose admin directory
    app.use(
        "/admin",
        connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
        ensureHasRole(Role.ADMIN),
        express.static("admin")
    );

    app.use(
        "/admin/config",
        connectionEnsureLogin.ensureLoggedIn(loggedInOptions),
        ensureHasRole(Role.ADMIN),
        express.static("admin/config.html")
    );

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

    return app;
}

function setupGameServer(app: Express): Server {
    // Create game server
    const gameServer: Server = new Server({
        server: http.createServer(app),
        express: app,
        verifyClient: (info, next) => {
            // Make "session" available for the WebSocket connection (during onAuth())
            getSessionHandler()(info.req as any, {} as any, () => next(true));
        },
        //pingInterval: 0, // Number of milliseconds for the server to "ping" the clients. Default: 3000
        // The clients are going to be forcibly disconnected if they can't respond after pingMaxRetries retries.
        // Maybe this solves the problem that you can't move after some time doing nothing on the website.
        //pingMaxRetries: 2, // Maximum allowed number of pings without a response. Default: 2.
    });

    // Register the TURoom (defined in src/common/rooms/turoom.ts)
    gameServer.define("turoom", TURoom).enableRealtimeListing();

    /*
     * Register colyseus monitor AFTER registering your room handlers
     *
     * See: https://docs.colyseus.io/tools/monitor/
     */
    app.use("/colyseus", connectionEnsureLogin.ensureLoggedIn(loggedInOptions), ensureHasRole(Role.ADMIN), monitor());

    return gameServer;
}

// Start the server
setupApp()
    .then(setupGameServer)
    .then(gameServer => gameServer.listen(SERVER_PORT))
    .then(() => console.log(`Listening on http://localhost:${SERVER_PORT}`))
    .catch(console.error);
