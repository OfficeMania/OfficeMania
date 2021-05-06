import { Room, Client } from "colyseus";
import { State, PlayerData } from "./schema/state";

export var PLAYER_MOVEMENT_PER_SECOND = 100;
const MS_PER_UPDATE = 10;



/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {
    onCreate (options: any) {
        let state = new State();
        this.setState(state);


        //recieves data from all the clients
        this.onMessage("move", (client, message) => {
            switch(message){
                case "moveDown":{
                    this.state.players[client.sessionId].y += PLAYER_MOVEMENT_PER_SECOND / 1000 * MS_PER_UPDATE;
                    break;
                }
                case "moveUp":{
                    this.state.players[client.sessionId].y -= PLAYER_MOVEMENT_PER_SECOND / 1000 * MS_PER_UPDATE;
                    break;
                }
                case "moveLeft":{
                    this.state.players[client.sessionId].x -= PLAYER_MOVEMENT_PER_SECOND / 1000 * MS_PER_UPDATE;
                    break;
                }
                case "moveRight":{
                    this.state.players[client.sessionId].x += PLAYER_MOVEMENT_PER_SECOND / 1000 * MS_PER_UPDATE;
                    break;
                }

            }
             

        });
    }

    onAuth(client: Client, options: any, req: any) {
        return true;
    }

    onJoin (client: Client) {
        const playerdata: PlayerData = new PlayerData()
        this.state.players[client.sessionId] = playerdata;
        this.state.players[client.sessionId].name = "";
        this.state.players[client.sessionId].x = 0;
        this.state.players[client.sessionId].y = 0;
    }

    onLeave (client: Client, consented: boolean) {
        delete this.state.players[client.sessionId];
    }
    

    onDispose () { }

    
    
}