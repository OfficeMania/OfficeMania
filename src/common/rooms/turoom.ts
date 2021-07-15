import {Client, Room} from "colyseus";
import {doorState, PlayerData, PongState, State, WhiteboardPlayer} from "./schema/state";
import fs from 'fs';
import {Direction, generateUUIDv4, MessageType} from "../util";
import {ArraySchema} from "@colyseus/schema";
import {registerPongHandler} from "../handler/ponghandler";

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

        registerPongHandler.call(this);

        this.onMessage(MessageType.INTERACTION, (client, message) => {
            switch (message) {
                case "pong": {
                    let inGame: number = this.getPongGame(client);
                    if(inGame === -1) {
                        let emptyGame = this.getEmptyPongGame();
                        console.log("empty game: " + emptyGame);
                        if (emptyGame !== -1) {
                            let emptyState: PongState = this.state.pongStates[emptyGame.toString()];
                            if (emptyState){
                                if (!emptyState.playerA){
                                    emptyState.playerA = client.sessionId;
                                    emptyState.posPlayerB = 500 - (emptyState.sizes.at(1)/2)
                                }
                                if (!emptyState.playerB){
                                    emptyState.playerB = client.sessionId;
                                    emptyState.posPlayerB = 500 - (emptyState.sizes.at(1)/2)
                                }
                            }
                        }
                        else {
                            console.log("creating new pongstate");
                            console.log(this.getNextPongSlot());
                            let ar = this.getNextPongSlot();
                            let newState = new PongState();
                            newState.playerA = client.sessionId;
                            newState.velocities.push(10,10);
                            newState.sizes.push(10, 100)
                            newState.posPlayerA = 500 - (newState.sizes.at(1)/2);
                            newState.velBallX = 1;
                            newState.velBallY = 0;
                            this.state.pongStates[ar.toString()] = newState;
                            console.log(this.state.pongStates[ar.toString()].posPlayerA);
                        }
                    }
                    setTimeout(() => client.send(MessageType.INTERACTION, "pong-init"), 1000);
                    setTimeout(() => this.clients.forEach((client) => client.send(MessageType.INTERACTION, "pong-update")), 1000);
                    break;
                }
                case "pong-end": {
                    let inGame: number = this.getPongGame(client);
                    if(inGame !== -1) {
                        this.state.pongStates.delete(inGame.toString());
                    }
                    break;
                }
                case "pong-leave": {
                    let n = this.getPongGame(client);
                    if(n !== -1) {
                        let game: PongState = this.state.pongStates[n.toString()];
                        game.playerA === client.sessionId? game.playerA = null: game.playerB = null;
                        game.playerA === null && game.playerB === null? this.state.pongStates.delete(n.toString()): {};
                        setTimeout(() => this.clients.forEach((client) => client.send(MessageType.INTERACTION, "pong-update")), 1000)
                    }
                    
                    break;
                }
                case "pong-init":
                case "pong-update": break;
                default: {
                    console.log("type of interaction not defined in the turoom onMessage(MessageType.INTERACTION): " + message);
                }
            }
        })

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
        /**
         * any way to handle this neater? (duplicate of line 114 onwards)
         */
        let n = this.getPongGame(client);
        if(n !== -1) {
            let game: PongState = this.state.pongStates[n.toString()];
            game.playerA === client.sessionId? () => {game.playerA = null; game.posPlayerA = null}: () => {game.playerB = null; game.posPlayerB = null};
            game.playerA === null && game.playerB === null? () => {this.state.pongStates.delete(n.toString()); console.log("deleting empty gamestate")}: {};
            
            setTimeout(() => this.clients.forEach((client) => client.send(MessageType.INTERACTION, "pong-update")), 1000)
        }
        delete this.state.players[client.sessionId];
    }

    onDispose() {
        //Nothing?
    }

    //gameloop for server
    update(deltaTime) {

    }

    getPongGame(client): number{
        for(let i = 0; i < this.state.pongStates.size; i++) {
            if (this.state.pongStates[i.toString()].playerA === client.sessionId || this.state.pongStates[i.toString()].playerB === client.sessionId){
                return i;
            }
        }
        return -1;
    }

    getEmptyPongGame(): number {
        if(!this.state.pongStates.size) { return -1; }
        for(let i = 0; i < this.state.pongStates.size; i++) {
            console.log(this.state.pongStates[i.toString()].playerA);
            console.log(this.state.pongStates[i.toString()].playerB);
            if (!this.state.pongStates[i.toString()].playerA || this.state.pongStates[i.toString()].playerA === null || !this.state.pongStates[i.toString()].playerB || this.state.pongStates[i.toString()].playerB === null){
                return i;
            }
        }
        return -1;
    }

    getNextPongSlot(): number {
        if(!this.state.pongStates.size) { return 0; }
        for(let i = 0; i <= this.state.pongStates.size; i++) {
            if (!this.state.pongStates[i.toString()]) {
                return i;
            }
        }
        return;
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
