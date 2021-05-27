import { Room, Client } from "colyseus";
import { State, PlayerData } from "./schema/state";
import { TILE_SIZE } from "../../client/player"
import { cli } from "webpack";


let i = 0
/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {
    onCreate (options: any) {
        let state = new State();
        this.setState(state);

        //sets the interval in which update gets called
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        //loads paths from assets
        var fs = require('fs');
        var files: string[] = fs.readdirSync('./assets/img/characters');
        for (let path of files){
            this.state.playerSpritePaths.push(path) 
        }

        //recieves movement from all the clients
        this.onMessage("move", (client, message) => {
            switch(message){
                case "moveDown":{
                    this.state.players[client.sessionId].y += TILE_SIZE;
                    break;
                }
                case "moveUp":{
                    this.state.players[client.sessionId].y -= TILE_SIZE;
                    break;
                }
                case "moveLeft":{
                    this.state.players[client.sessionId].x -= TILE_SIZE;
                    break;
                }
                case "moveRight":{
                    this.state.players[client.sessionId].x += TILE_SIZE;
                    break;
                }

            }
             

        });

        //recieves character changes
        this.onMessage("character", (client, message) => {
            this.state.players[client.sessionId].character = message;
        });
    }

    onAuth(client: Client, options: any, req: any) {
        return true;
    }

    onJoin (client: Client) {
        const playerdata: PlayerData = new PlayerData()
        this.state.players[client.sessionId] = playerdata;
        this.state.players[client.sessionId].name = "";
        this.state.players[client.sessionId].character = "Adam_48x48.png";
        this.state.players[client.sessionId].x = 0;
        this.state.players[client.sessionId].y = 0;
    }

    onLeave (client: Client, consented: boolean) {
        delete this.state.players[client.sessionId];
    }
    

    onDispose () { }
    
    //gameloop for server
    update (deltaTime) {

    }
}