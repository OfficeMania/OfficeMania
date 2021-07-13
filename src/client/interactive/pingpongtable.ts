import { Room } from "colyseus.js";
import { State } from "../../common";
import { PongState } from "../../common/rooms/schema/state";
import { MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { Player } from "../player";
import { getOurPlayer, getPlayers, getRoom, PlayerRecord } from "../util";
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
        this.getPongs();
        this.ourGame = this.pongs[this.getGame(this.ourPlayer.id).toString()];
        this.ourGame.canvas.style.visibility = "visible";
        this.ourGame.updatePos();
        checkInputMode();
    }
    getPongs() {
        let i = 0;
        console.log(this.room.state.pongStates.size);
        while (this.room.state.pongStates[i]) {
            if(!this.pongs[i]) {
                this.pongs[i] = this.getPongFromState(this.room.state.pongStates[i]);
            }
            this.pongs[i].updatePos();
            i++;
        }
        /**this.room.state.pongStates.forEach(() => {
            if(!this.pongs[i]) {
                this.pongs[i] = this.getPongFromState(this.room.state.pongStates[i]);
            }
            this.pongs[i].updatePos();
            i++;
        });*/
    }
    getPongFromState(state: PongState): Pong {
        let pong: Pong = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
        pong.playerA = new PongPlayer(state.playerIds[0]);
        if(state.playerIds[1]) { pong.playerB = new PongPlayer(state.playerIds[1]); }
        console.log("created a pong game")
        return pong;
    }
    getGame(client): number{
        for(let i = 0; i < this.room.state.pongStates.size; i++) {
            if (this.room.state.pongStates[i.toString()].playerIds.array.forEach(id => { id === client.sessionId; })){
                return i;
            }
        }
        return -1;
    }

}