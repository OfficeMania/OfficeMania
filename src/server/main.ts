import http from "http";
import serveIndex from 'serve-index';
import express from "express";
import cors from "cors";
import path from 'path';
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";

import { TURoom } from "../common/rooms/turoom";
import { SERVER_PORT } from "./config";

const app = express();

// Enable cors
app.use(cors());

// Enable JSON-parsing / processing
app.use(express.json())

// Create game server
const gameServer = new Server({
    server: http.createServer(app),
    express: app,
    pingInterval: 0,
});

// "Mount" the html folder as the root of the website
app.use('/', serveIndex(path.join(process.cwd(), "html"), {'icons': true}));
app.use('/', express.static(path.join(process.cwd(), "html")));

/*
 * "Mount" the assets/img directory under "[host]/img"
 *
 * In an HTML-document you can load the images via:
 *   <img src="/img/[image-name]" />
 */
app.use('/img', express.static(path.join(process.cwd(), "assets", "img")));

/*
 * "Mount" the assets/map directory under "[host]/map"
 */
app.use('/map', express.static(path.join(process.cwd(), "assets", "map")));

/*
 * "Mount" the assets/templates directory under "[host]/templates"
 */
app.use('/templates', express.static(path.join(process.cwd(), "assets", "templates")));

/*
 * "Mount" the directory where the client JavaScript is generated to (dist/client)
 * under "[host]/img"
 * 
 * In an HTML-document you can load the scripts via:
 *   <script src="/js/[script-name]"></script>
 */
app.use('/js', express.static(path.join(process.cwd(), "dist", "client")));

// Register the TURoom (defined in src/common/rooms/turoom.ts)
gameServer.define("turoom", TURoom)
    .enableRealtimeListing();

/*
 * Register colyseus monitor AFTER registering your room handlers
 *
 * See: https://docs.colyseus.io/tools/monitor/
 */
// app.use("/colyseus", monitor());

// Start the server
gameServer.listen(SERVER_PORT);
console.log(`Listening on http://localhost:${SERVER_PORT}`);