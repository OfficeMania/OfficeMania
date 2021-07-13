import {Client, Room} from "colyseus";
import {doorState, PlayerData, PongState, State, WhiteboardPlayer} from "./schema/state";
import fs from 'fs';
import {Direction, generateUUIDv4, MessageType} from "../util";
import {ArraySchema, MapSchema} from "@colyseus/schema";
import { cli } from "webpack";

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

        this.onMessage(MessageType.MOVE_PONG, (client, message) => {
            if (this.state.pongStates[this.getPongGame(client).toString()] && this.state.pongStates[this.getPongGame(client).toString()].playerA === client.sessionId) {
                switch (message) {
                    case Direction.UP: {
                        if(this.state.pongStates[this.getPongGame(client).toString()].posPlayerA > 0){
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerA--;
                        }
                        else {
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerA = 0;
                        }
                        break;
                    }
                    case Direction.DOWN: {
                        if(this.state.pongStates[this.getPongGame(client).toString()].posPlayerA < 1000){
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerA++;
                        }
                        else {
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerA = 1000;
                        }
                        break;
                    }
                }
            }
            else if (this.state.pongStates[this.getPongGame(client).toString()] && this.state.pongStates[this.getPongGame(client).toString()].playerB === client.sessionId) {
                switch (message) {
                    case Direction.UP: {
                        if(this.state.pongStates[this.getPongGame(client).toString()].posPlayerB > 0){
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerB--;
                        }
                        else {
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerB = 0;
                        }
                        break;
                    }
                    case Direction.DOWN: {
                        if(this.state.pongStates[this.getPongGame(client).toString()].posPlayerB < 1000){
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerB++;
                        }
                        else {
                            this.state.pongStates[this.getPongGame(client).toString()].posPlayerB = 1000;
                        }
                        break;
                    }
                }
            }
        })

        this.onMessage(MessageType.INTERACTION, (client, message) => {
            switch (message) {
                case "pong": {
                    let inGame: number = this.getPongGame(client);
                    if(inGame === -1) {
                        let emptyGame = this.getEmptyPongGame();
                        console.log("empty game: " + emptyGame);
                        if (emptyGame !== -1) {
                            if (this.state.pongStates[emptyGame]){
                                if (isStringEmpty(this.state.pongStates[emptyGame].playerIds[0])){
                                    this.state.pongStates[emptyGame].playerIds[0] = client.sessionId;
                                }
                                if (isStringEmpty(this.state.pongStates[emptyGame].playerIds[1])){
                                    this.state.pongStates[emptyGame].playerIds[1] = client.sessionId;
                                }
                            }
                        }
                        else {
                            console.log("creating new pongstate");
                            let newPong = new PongState();
                            newPong.playerIds[0] = client.sessionId;
                            this.state.pongStates.set(this.getNextPongSlot().toString(), newPong);
                        }
                    }
                    break;
                }
                case "pong-end": {
                    let inGame: number = this.getPongGame(client);
                    if(inGame !== -1) {
                        this.state.pongStates.delete(inGame.toString());
                    }
                    break;
                }
                default: {
                    console.log("type of interaction not defined in the turoom onMessage(MessageType.INTERACTION)");
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
            if (this.state.pongStates[i.toString()].playerIds[0] === client.sessionId || this.state.pongStates[i.toString()].playerIds[1] === client.sessionId){
                return i;
            }
        }
        return -1;
    }

    getEmptyPongGame(): number {
        if(!this.state.pongStates.size) { return -1; }
        for(let i = 0; i < this.state.pongStates.size; i++) {
            if (!this.state.pongStates[i.toString()].playerIds[0] || !this.state.pongStates[i.toString()].playerIds[1]){
                return i;
            }
        return -1;
        }
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
function isStringEmpty(entry: string): boolean{
    if(!entry) {
        return true;
    }
    if(entry = ""){
        return true;
    }
    return false;
}
