import {Room} from "colyseus.js";
import {State} from "../../common";
import {PongState} from "../../common/rooms/schema/state";
import {Direction, MessageType} from "../../common/util";
import {checkInputMode} from "../main";
import {Player} from "../player";
import {getOurPlayer, getPlayers, getRoom, PlayerRecord} from "../util";
import {Interactive} from "./interactive";
import {Pong, PongPlayer} from "./pong";
import {PongMessage} from "../../common/handler/ponghandler";

let ourGame: Pong;
export class PingPongTable extends Interactive{
    pongs: Pong[];

    room: Room<State>;
    ourPlayer: Player;
    players: PlayerRecord;
    previousInput: Direction[];

    constructor() {
        super("pingpongtable", false, 2)
        this.room = getRoom();
        this.players = getPlayers();
        this.pongs = [];
        this.input = [null];
        this.previousInput = this.input;
    }

    onInteraction() {
        this.ourPlayer = getOurPlayer();
        this.players = getPlayers();
        if(!ourGame) {
            this.room.send(MessageType.PONG_INTERACTION, PongMessage.ON_INTERACTION);
            console.log("Pong game interaction...");
            //this.getPongs();


            ourGame = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
            ourGame.canvas.style.visibility = "visible";
            const button = document.createElement("BUTTON");
            button.addEventListener("click", () => this.leave())
            button.innerHTML= "<em class = \"fa fa-times\"></em>";
            button.id = "close";
            this.buttonBar.appendChild(button)
            checkInputMode();
            this.room.onMessage(MessageType.PONG_INTERACTION, (message) => {
                console.log("interatction message recieved in client" + message)
                if (message === PongMessage.INIT) {
                    this.getPongs();
                    console.log(ourGame);
                    console.log(this.pongs);
                    ourGame = this.pongs[this.getGame(this.ourPlayer.id)];
                    console.log(ourGame);

                }
                if (message === PongMessage.UPDATE) {
                    if (ourGame){
                        ourGame.selfGameId = this.getGame(this.ourPlayer.id);
                        if(!ourGame.playerB){this.updateState()};
                        console.log(ourGame)
                        ourGame.paint();
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
        pong.playerA = new PongPlayer(state.playerA);
        if(state.playerB) { pong.playerB = new PongPlayer(state.playerB); }
        try {
            pong.sizeBall = state.sizes.at(0);
            pong.sizeBat = state.sizes.at(1);
        }
        catch(e){
            console.warn("PROPERTY HAS NOT BEEN LOADED INTO PONGSTATE")
        }
        //console.log("created a pong game");
        //console.log(pong.playerA);
        pong.updatePos();
        return pong;
    }
    getGame(clientId: string): number{
        for(let i = 0; i < this.room.state.pongStates.size; i++) {
            //console.log(this.room.state.pongStates["0"].playerA);
            if (this.room.state.pongStates[i.toString()].playerA === clientId|| this.room.state.pongStates[i.toString()].playerB === clientId){
                console.log("checking game: " + i)
                return i;
            }
        }
        console.log("nothing found, exiting");
        return -1;
    }
    loop() {
        if(ourGame) {

            ourGame.loop();
            this.updateInput();
        }
    }
    leave() {
        ourGame.canvas.style.visibility = "hidden";
        document.getElementById("close").remove();
        this.room.send(MessageType.PONG_INTERACTION, PongMessage.LEAVE);
        ourGame = null;
        this.pongs = [];
        checkInputMode();
    }
    updateState() {
        if(this.room.state.pongStates[ourGame.selfGameId.toString()].playerB && !ourGame.playerB) {
            console.log("inserting player b");
            ourGame.playerB = new PongPlayer(this.room.state.pongStates[this.getGame(this.ourPlayer.id).toString()].playerB);
            console.log(ourGame);
        }
    }
    updateInput() {
        //console.log(this.input);
        switch (this.input[0]) {
            case Direction.UP: {
                this.room.send(MessageType.PONG_MOVE, Direction.UP);
                break;
            }
            case Direction.DOWN: {
                this.room.send(MessageType.PONG_MOVE, Direction.DOWN);
                break;
            }
            default: {
                //this.room.send(MessageType.MOVE_PONG, null);
                break;
            }
        }

    }

}
