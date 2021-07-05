import {Client, Room} from "colyseus";
import {PlayerData, State} from "./schema/state";
import fs from 'fs';
import {generateUUIDv4, KEY_CHARACTER, KEY_USERNAME} from "../util";

/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {
    onCreate (options: any) {
        const state = new State();
        this.setState(state);

        //generate jitsi conference id and password
        const conferenceId = generateUUIDv4();
        const conferencePassword = generateUUIDv4();

        //TODO rework the conference so that the server can join a conference too, before anyone else, and become moderator to lock the room down with a password

        state.conference.id = conferenceId;
        //state.conference.password = conferencePassword;
        state.conference.password = undefined;

        //sets the interval in which update gets called
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));


        //loads paths from assets
        var files: string[] = fs.readdirSync('./assets/img/characters');
        for (let path of files){
            if (path.includes(".png")){
                this.state.playerSpritePaths.push(path)
            }
        }

        //loads paths from templates
        var path = require('path');
        getPaths("./assets/templates", this.state);

        function getPaths(startParth, newState: State) {

            if (!fs.existsSync(startParth)) {
                return;
            }

            var files = fs.readdirSync(startParth);
            for (let i = 0; i < files.length; i++) {

                let filename: string = path.join(startParth, files[i]);
                var stat = fs.lstatSync(filename);
                if(stat.isDirectory()) {
                    getPaths(filename, newState);
                }
                else if (filename.indexOf("png") >= 0) {
                    newState.templatePaths.push(filename);
                }
            }
        }



        //recieves movement from all the clients
        this.onMessage("move", (client, message) => {
            if (this.state.players[client.sessionId].cooldown <= 0){
                switch(message){
                    case "moveDown":{
                        this.state.players[client.sessionId].cooldown = 0;
                        this.state.players[client.sessionId].y++;
                        break;
                    }
                    case "moveUp":{
                        this.state.players[client.sessionId].cooldown = 0;
                        this.state.players[client.sessionId].y--;
                        break;
                    }
                    case "moveLeft":{
                        this.state.players[client.sessionId].cooldown = 0;
                        this.state.players[client.sessionId].x--;
                        break;
                    }
                    case "moveRight":{
                        this.state.players[client.sessionId].cooldown = 0;
                        this.state.players[client.sessionId].x++;
                        break;
                    }
                }
            }


        });

        //recieves character changes
        this.onMessage(KEY_CHARACTER, (client, message) => {
            this.state.players[client.sessionId].character = message;
        });

        //recieves name changes
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

    onJoin (client: Client) {
        this.state.players[client.sessionId] = new PlayerData();
        this.state.players[client.sessionId].name = "";
        this.state.players[client.sessionId].character = "Adam_48x48.png";
        this.state.players[client.sessionId].x = 0;
        this.state.players[client.sessionId].y = 0;
        this.state.players[client.sessionId].cooldown = 0;
        this.state.players[client.sessionId].participantId = null;
    }

    onLeave (client: Client, consented: boolean) {
        delete this.state.players[client.sessionId];
    }

    onDispose () { }

    //gameloop for server
    update (deltaTime) {
        for (let [id, player] of this.state.players){
            if (player.cooldown > 0){
                player.cooldown--;
            }

        }
    }
}
