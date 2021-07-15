import {Client, Presence, Room} from "colyseus";
import {doorState, PlayerData, State, WhiteboardPlayer} from "./schema/state";
import fs from 'fs';
import {Direction, generateUUIDv4, MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";
import {PongHandler} from "../handler/ponghandler";
import {Handler} from "../handler/handler";

const path = require('path');

const pongHandler: PongHandler = new PongHandler();

const handlers: Handler[] = [pongHandler];

/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {

    constructor(presence: Presence) {
        super(presence);
        handlers.forEach((handler) => handler.init(this));
    }

    onCreate(options: any) {
        const state = new State();
        this.setState(state);

        this.autoDispose = false;

        //generate jitsi conference id and password
        const conferenceId = generateUUIDv4();
        const conferencePassword = generateUUIDv4();

        console.debug(`conferenceId:       ${conferencePassword}`);
        console.debug(`conferencePassword: ${conferencePassword}`);

        //TODO rework the conference so that the server can join a conference too, before anyone else, and become moderator to lock the room down with a password

        state.conference.id = conferenceId;
        //state.conference.password = conferencePassword;
        state.conference.password = undefined;

        //sets the interval in which update gets called
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        //loads paths from assets
        fs.readdirSync('./assets/img/characters').filter(file => file.includes(".png")).forEach(file => this.state.playerSpritePaths.push(file));

        //loads paths from templates
        getPaths("./assets/templates", this.state);

        //receives movement from all the clients
        this.onMessage(MessageType.MOVE, (client, message) => {
            if (this.state.players[client.sessionId].cooldown <= 0) {
                switch (message) {
                    case Direction.DOWN: {
                        this.state.players[client.sessionId].y++;
                        break;
                    }
                    case Direction.UP: {
                        this.state.players[client.sessionId].y--;
                        break;
                    }
                    case Direction.LEFT: {
                        this.state.players[client.sessionId].x--;
                        break;
                    }
                    case Direction.RIGHT: {
                        this.state.players[client.sessionId].x++;
                        break;
                    }
                }
            }
        });

        this.onMessage(MessageType.PATH, (client, message) => {
            if (message === -1) {
                this.state.whiteboardPlayer[client.sessionId].paths.push(-1);
            } else {
                this.state.whiteboardPlayer[client.sessionId].paths.push(...message);
            }
            this.broadcast(MessageType.REDRAW, client, {except: client});
        });

        this.onMessage(MessageType.CLEAR_WHITEBOARD, (client, message) => {
            for (const [, player] of this.state.whiteboardPlayer) {
                player.paths = new ArraySchema<number>();
            }
            this.broadcast(MessageType.CLEAR_WHITEBOARD, {except: client});
        });

        //receives character changes
        this.onMessage(MessageType.UPDATE_CHARACTER, (client, message) => {
            this.state.players[client.sessionId].character = message;
        });

        //receives name changes
        this.onMessage(MessageType.UPDATE_USERNAME, (client, message) => {
            this.state.players[client.sessionId].name = message;
        });

        this.onMessage(MessageType.UPDATE_PARTICIPANT_ID, (client, message) => {
            this.state.players[client.sessionId].participantId = message; //TODO Maybe let the server join the jitsi conference too (without mic/cam) and then authenticate via the jitsi chat, that a player is linked to a participantId, so that one cannot impersonate another one.
        });

        this.onMessage(MessageType.DOOR, (client, message) => {

            if (this.state.doorStates[message] !== null) {

                this.state.doorStates[message] = new doorState();
                this.state.doorStates[message].isClosed = false;
                this.state.doorStates[message].playerId = "";
            }
        })
        handlers.forEach((handler) => handler.onCreate(options));
    }

    onAuth(client: Client, options: any, req: any) {
        return true;
    }

    onJoin(client: Client) {
        this.state.players[client.sessionId] = new PlayerData();
        this.state.players[client.sessionId].name = "";
        this.state.players[client.sessionId].character = "Adam_48x48.png";
        this.state.players[client.sessionId].x = 0;
        this.state.players[client.sessionId].y = 0;
        this.state.players[client.sessionId].cooldown = 0;
        this.state.players[client.sessionId].participantId = null;
        this.state.whiteboardPlayer[client.sessionId] = new WhiteboardPlayer();
        this.broadcast("newPlayer", client); //Does this get used any where?
        handlers.forEach((handler) => handler.onJoin(client));
    }

    onLeave(client: Client, consented: boolean) {
        handlers.forEach((handler) => handler.onLeave(client, consented));
        delete this.state.players[client.sessionId];
    }

    onDispose() {
        //Nothing?
        handlers.forEach((handler) => handler.onDispose());
    }

    //gameloop for server
    update(deltaTime) {
        //Nothing?
    }

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
