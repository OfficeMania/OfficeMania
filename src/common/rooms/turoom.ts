import {Client, Room} from "colyseus";
import {PlayerData, State, WhiteboardPlayer} from "./schema/state";
import fs from 'fs';
import {generateUUIDv4, KEY_CHARACTER, KEY_USERNAME, MoveDirection} from "../util";
import {ArraySchema} from "@colyseus/schema";

const path = require('path');

/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {
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
            })
        }

        //receives movement from all the clients
        this.onMessage("move", (client, message) => {
            if (this.state.players[client.sessionId].cooldown <= 0) {
                switch (message) {
                    case MoveDirection.DOWN: {
                        this.state.players[client.sessionId].y++;
                        break;
                    }
                    case MoveDirection.UP: {
                        this.state.players[client.sessionId].y--;
                        break;
                    }
                    case MoveDirection.LEFT: {
                        this.state.players[client.sessionId].x--;
                        break;
                    }
                    case MoveDirection.RIGHT: {
                        this.state.players[client.sessionId].x++;
                        break;
                    }
                }
            }
        });

        this.onMessage("path", (client, message) => {
            if (message === -1) {
                this.state.whiteboardPlayer[client.sessionId].paths.push(-1);
            } else {
                this.state.whiteboardPlayer[client.sessionId].paths.push(...message);
            }
            this.broadcast("redraw", client, {except: client});
        });

        this.onMessage("clearWhiteboard", (client, message) => {
            for (const [, player] of this.state.whiteboardPlayer) {
                player.paths = new ArraySchema<number>();
            }
            this.broadcast("clearWhiteboard", {except: client});
        });


        //receives character changes
        this.onMessage(KEY_CHARACTER, (client, message) => {
            this.state.players[client.sessionId].character = message;
        });

        //receives name changes
        this.onMessage(KEY_USERNAME, (client, message) => {
            this.state.players[client.sessionId].name = message;
        });

        this.onMessage("updateParticipantId", (client, message) => {
            this.state.players[client.sessionId].participantId = message; //TODO Maybe let the server join the jitsi conference too (without mic/cam) and then authenticate via the jitsi chat, that a player is linked to a participantId, so that one cannot impersonate another one.
        });
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
        this.broadcast("newPlayer", client);
    }

    onLeave(client: Client, consented: boolean) {
        delete this.state.players[client.sessionId];
    }

    onDispose() {
        //Nothing?
    }

    //gameloop for server
    update(deltaTime) {

    }
}
