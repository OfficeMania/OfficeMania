import {Client, Presence, Room} from "colyseus";
import {State} from "./schema/state";
import fs from 'fs';
import {generateUUIDv4} from "../util";
import {PongHandler} from "../handler/ponghandler";
import {Handler} from "../handler/handler";
import {DoorHandler} from "../handler/doorhandler";
import {PlayerHandler} from "../handler/playerhandler";
import {WhiteboardHandler} from "../handler/whiteboardhandler";

const path = require('path');

const doorHandler: DoorHandler = new DoorHandler();
const playerHandler: PlayerHandler = new PlayerHandler();
const pongHandler: PongHandler = new PongHandler();
const whiteboardHandler: WhiteboardHandler = new WhiteboardHandler();
const handlers: Handler[] = [doorHandler, playerHandler, pongHandler, whiteboardHandler];

/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {

    constructor(presence: Presence) {
        super(presence);
        handlers.forEach((handler) => handler.init(this));
    }

    onCreate(options: any) {
        this.setState(new State());
        this.autoDispose = false;
        //generate jitsi conference id and password
        setupConferenceData(this.state);
        //sets the interval in which update gets called
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));
        //loads paths from assets
        fs.readdirSync('./assets/img/characters').filter(file => file.includes(".png")).forEach(file => this.state.playerSpritePaths.push(file));
        //loads paths from templates
        getPaths("./assets/templates", this.state);
        handlers.forEach((handler) => handler.onCreate(options));
    }

    onAuth(client: Client, options: any, req: any) {
        return true;
    }

    onJoin(client: Client) {
        handlers.forEach((handler) => handler.onJoin(client));
    }

    onLeave(client: Client, consented: boolean) {
        handlers.forEach((handler) => handler.onLeave(client, consented));
        delete this.state.players[client.sessionId];
    }

    onDispose() {
        handlers.forEach((handler) => handler.onDispose());
    }

    //gameloop for server
    update(deltaTime) {
        //Nothing?
    }

}

function setupConferenceData(state: State) {
    const conferenceId = generateUUIDv4();
    const conferencePassword = generateUUIDv4();
    console.debug(`conferenceId:       ${conferencePassword}`);
    console.debug(`conferencePassword: ${conferencePassword}`);
    //TODO rework the conference so that the server can join a conference too, before anyone else, and become moderator to lock the room down with a password
    state.conference.id = conferenceId;
    //state.conference.password = conferencePassword;
    state.conference.password = undefined;
}

function getPaths(startPath, newState: State) {
    if (!fs.existsSync(startPath)) {
        return;
    }
    fs.readdirSync(startPath).forEach(file => {
        const filename: string = path.join(startPath, file);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            getPaths(filename, newState);
        } else if (filename.indexOf("png") >= 0) {
            newState.templatePaths.push(filename);
        }
    });
}
