import { Room } from "colyseus.js";
import { State } from "../../common";
import { PongState } from "../../common/rooms/schema/state";
import { MessageType } from "../../common/util";
import { setInputMode } from "../input";
import { checkInputMode } from "../main";
import { Player } from "../player";
import { getOurPlayer, getPlayers, getRoom, InputMode, PlayerRecord } from "../util";
import { Interactive } from "./interactive";
import { Pong, PongPlayer } from "./pong";

export class PingPongTable extends Interactive{
    pongs: Pong[];
    ourGame: Pong;
    room: Room<State>;
    ourPlayer: Player;
    players: PlayerRecord;

    
    constructor() {
        super("pingpongtable", false, 2)
        this.room = getRoom();
        this.players = getPlayers();
        this.pongs = [];
    }
    
    onInteraction() {
        this.ourPlayer = getOurPlayer();
        this.players = getPlayers();
        this.room.send(MessageType.INTERACTION, "pong");
        console.log("Pong game interaction...");
        //this.getPongs();
        
        
        this.ourGame = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
        this.ourGame.canvas.style.visibility = "visible";
        
        
        checkInputMode();
        this.room.onMessage(MessageType.INTERACTION, (message) => {
            console.log("interatction message recieved in client" + message)
            if (message === "pong-init") {
                this.getPongs();
                console.log(this);
                this.ourGame = this.pongs[0];//this.getGame(this.ourPlayer.id)
            }
            if (message === "pong-update") {
                this.ourGame.paint();
            }
        });
        
    }
    getPongs() {
        let i = 0;
        console.log(this.room.state.pongStates[i.toString()].playerIds[0]);
        console.log(this.room.state.pongStates[0]);
        while (this.room.state.pongStates[i.toString()]) {
            console.log("state " + i);
            if(!this.pongs[i]) {
                this.pongs[i] = this.getPongFromState(this.room.state.pongStates[i.toString()]);
            }
            this.pongs[i].updatePos();
            i++;
        }
    }
    getPongFromState(state: PongState): Pong {
        let pong = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
        pong.playerA = new PongPlayer(state.playerIds[0]);
        if(state.playerIds[1]) { pong.playerB = new PongPlayer(state.playerIds[1]); }
        console.log("created a pong game");
        pong.updatePos();
        return pong;
    }
    getGame(clientId: string): number{
        for(let i = 0; i < this.room.state.pongStates.size; i++) {
            console.log(this.room.state.pongStates["0"].playerIds[0]);
            if (this.room.state.pongStates[i.toString()].playerIds.forEach(id => { id === clientId; })){
                return i;
            }
        }
        return -1;
    }

}