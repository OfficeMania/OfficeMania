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
    room: Room<State>;
    ourPlayer: Player;
    players: PlayerRecord;

    
    constructor() {
        super("pingpongtable", false, 2)
        this.room = getRoom();
        this.players
    }
    
    onInteraction() {
        this.ourPlayer = getOurPlayer();
        this.players = getPlayers();
        this.room.send(MessageType.INTERACTION, "pong");
        console.log("success");
        checkInputMode();
    }
    getPongs() {
        let allStates = this.room.state.pongStates;
        let i = 0;
        //this.pongs = [];
        allStates.forEach(() => {
            if(this.pongs[i]) {
                this.pongs[i] = this.getPongFromState(allStates[i]);
            }
            this.pongs[i].updatePos();
            i++;
        });
    }
    getPongFromState(state: PongState): Pong {
        let pong: Pong = new Pong(super.canvas, this.room, this.players, this.ourPlayer.id);
        pong.playerA = new PongPlayer(state.playerIds[0]);
        if(state.playerIds[1]) { pong.playerB = new PongPlayer(state.playerIds[1]); }
        return pong;
    }

}