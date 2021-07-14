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
        if(!this.ourGame) {
            this.room.send(MessageType.INTERACTION, "pong");
            console.log("Pong game interaction...");
            //this.getPongs();
            
            
            this.ourGame = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
            this.ourGame.canvas.style.visibility = "visible";
            const button = document.createElement("BUTTON");
            button.addEventListener("click", () => this.leave())
            button.innerHTML= "<em class = \"fa fa-times\"></em>";
            button.id = "close";
            this.buttonBar.appendChild(button)
            checkInputMode();
            this.room.onMessage(MessageType.INTERACTION, (message) => {
                console.log("interatction message recieved in client" + message)
                if (message === "pong-init") {
                    this.getPongs();
                    console.log(this.ourGame);
                    console.log(this.pongs);
                    this.ourGame = this.pongs[this.getGame(this.ourPlayer.id)];
                    console.log(this.ourGame);
                }
                if (message === "pong-update") {
                    if (this.ourGame){
                        console.log(this.ourGame)
                        this.ourGame.paint();
                    }
                    
                }
            });
        }
        else {
            console.log("already in a game");
        }
    }
    getPongs() {
        let i = 0;
        //console.log(this.room.state.pongStates);
        console.log(this.ourPlayer.id);
        console.log(this.room.state.pongStates["0"]);
        while (this.room.state.pongStates[i.toString()]) {
            console.log("state " + i);
            if(!this.pongs[i]) {
                console.log("nothing on pos "+ i)
                this.pongs[i] = this.getPongFromState(this.room.state.pongStates[i.toString()]);
                console.log(this.pongs[i])
            }
            this.pongs[i].updatePos();
            i++;
        }
    }
    getPongFromState(state: PongState): Pong {
        let pong = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
        pong.playerA = new PongPlayer(state.playerIds.at(0));
        if(state.playerIds[1]) { pong.playerB = new PongPlayer(state.playerIds.at(1)); }
        //console.log("created a pong game");
        //console.log(pong.playerA);
        pong.updatePos();
        return pong;
    }
    getGame(clientId: string): number{
        for(let i = 0; i < this.room.state.pongStates.size; i++) {
            //console.log(this.room.state.pongStates["0"].playerIds[0]);
            if (this.room.state.pongStates[i.toString()].playerIds.at(0) || this.room.state.pongStates[i.toString()].playerIds.at(1)){
                console.log("checking game: " + i)
                return i;
            }
        }
        console.log("nothing found, exiting");
        return -1;
    }
    loop() {
        if(this.ourGame) {
            if(!this.ourGame.playerB) {
                try {
                    this.ourGame.playerB = new PongPlayer(this.room.state.pongStates[this.getGame(this.ourPlayer.id).toString()].playerIds.at(1));
                    console.log(this.ourGame);
                }
                catch(e){console.log("no player B yet");}
            }
            this.ourGame.loop();
        }
    }
    leave() {
        this.ourGame.canvas.style.visibility = "hidden";
        document.getElementById("close").remove();
        this.room.send(MessageType.INTERACTION, "pong-end");
        this.ourGame = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
        this.pongs = [];
        checkInputMode();
    }

}