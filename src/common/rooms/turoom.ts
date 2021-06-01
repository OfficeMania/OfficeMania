import { Room, Client } from "colyseus";
import { State, PlayerData } from "./schema/state";
import { TILE_SIZE } from "../../client/player"
import { cli } from "webpack";
import fs from 'fs';


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
                        this.state.players[client.sessionId].cooldown = 6;
                        this.state.players[client.sessionId].y++;
                        break;
                    }
                    case "moveUp":{
                        this.state.players[client.sessionId].cooldown = 6;
                        this.state.players[client.sessionId].y--;
                        break;
                    }
                    case "moveLeft":{
                        this.state.players[client.sessionId].cooldown = 6;
                        this.state.players[client.sessionId].x--;
                        break;
                    }
                    case "moveRight":{
                        this.state.players[client.sessionId].cooldown = 6;
                        this.state.players[client.sessionId].x++;
                        break;
                    }
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
        this.state.players[client.sessionId].cooldown = 0;
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