import {Room} from "colyseus.js";
import {State} from "../../common";
import {PongState} from "../../common/rooms/schema/state";
import {Direction,  MessageType} from "../../common/util";
import {checkInputMode} from "../main";
import {Player} from "../player";
import {getOurPlayer, getPlayers, getRoom, PlayerRecord} from "../util";
import {Interactive} from "./interactive";
import {Pong, PongPlayer} from "./pong";
import {PongMessage} from "../../common/handler/ponghandler";

let ourGame: Pong;

export class PingPongTable extends Interactive {

    //pongs: Pong[];
    room: Room<State>;
    ourPlayer: Player;
    players: PlayerRecord;
    previousInput: Direction[];

    constructor() {
        super("Pong table", false, 2)
        this.room = getRoom();
        this.players = getPlayers();
        //this.pongs = [];
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
            ourGame = new Pong(this.canvas, this.room, this.players, "a");
            ourGame.canvas.style.visibility = "visible";
            checkInputMode();
            this.initListener();
            
        } else {
            console.log("already in a game");
        }
    }
    initListener() {
        this.room.onMessage(MessageType.PONG_INTERACTION, (message) => {
            console.log("interatction message recieved in client " + message)
            switch (message) {
                case PongMessage.INIT: {
                    this.getPong();
                    console.log(ourGame);
                    console.log("1st0");
                    console.log(ourGame);
                    console.log("ourgame");
                    this.createAuxilaryStuff();
                    break;
                }
                case PongMessage.UPDATE: {
                    if (ourGame){
                        console.log(this.room.state.pongStates);
                        ourGame.selfGameId = this.getGame(this.ourPlayer.id);
                        console.log(ourGame.selfGameId);
                        this.updateState();
                        console.log(ourGame)
                        ourGame.paint();
                    }
                    break;
                }
                case PongMessage.LEAVE: {
                    this.onLeave();
                }
                default: break;
            }
        });
    }
    getPong() {
        //console.log(this.room.state.pongStates);
        //console.log(this.ourPlayer.id);
        //console.log(this.room.state.pongStates["0"]);
        let stateSize = this.getHighestIndex();
        this.room.state.pongStates.forEach((state) => {
            if(state.playerA === this.ourPlayer.id || state.playerB === this.ourPlayer.id) {
                ourGame = this.getPongFromState(state);
            }
        })
        /*
        for (let i = 0; i < stateSize; i++) {
            console.log("state " + i);
            if (this.room.state.pongStates[i.toString()]) {
                console.log("now written " + i)
                pongs.push(this.getPongFromState(this.room.state.pongStates[i.toString()]));
                console.log(this.pongs[i])
            }
        }*/
    }

    getPongFromState(state: PongState): Pong {
        if (state) {
            let pong = new Pong(this.canvas, this.room, this.players, this.ourPlayer.id);
            pong.playerA = new PongPlayer(state.playerA);
            if (state.playerB) {
                pong.playerB = new PongPlayer(state.playerB);
            }
            try {
                pong.sizeBall = state.sizes.at(0);
                pong.sizeBat = state.sizes.at(1);
            } catch (e) {
                console.warn("PROPERTY HAS NOT BEEN LOADED INTO PONGSTATE")
            }
            //console.log("created a pong game");
            //console.log(pong.playerA);
            pong.updatePong();
            return pong;
        }
        return;
    }

    getGame(clientId: string): number {
        for (let i = 0; i < this.getHighestIndex(); i++) {
            if (this.room.state.pongStates[i.toString()].playerA === clientId) {
                console.log("game: " + i)
                return i;
            }
            else if (this.room.state.pongStates[i.toString()].playerB === clientId) {
                console.log("game: " + i)
                return i;
            }
        }
        console.log("nothing found, exiting");
        return -1;
    }

    loop() {
        if (ourGame) {
            this.room.send(MessageType.PONG_UPDATE);
            ourGame.loop();
            this.updateInput();
        }
    }

    leave() {
        ourGame.canvas.style.visibility = "hidden";
        this.room.removeAllListeners();
        document.getElementById("close").remove();
        this.room.send(MessageType.PONG_INTERACTION, PongMessage.LEAVE);
        ourGame = null;
        //this.pongs = [];
        checkInputMode();
        document.getElementById("p");
    }
    onLeave() {
        if (!this.room.state.pongStates[ourGame.selfGameId.toString()]) {
            this.leave();
        }
    }


    updateState() {
        //check for player A in state
        const playerA: string = this.room.state.pongStates[ourGame.selfGameId.toString()].playerA;
        if(playerA) {
            console.log("a found");
            if(!ourGame.playerA) {
                console.log("inserting player A");
                ourGame.playerA = new PongPlayer(this.room.state.pongStates[this.getGame(this.ourPlayer.id).toString()].playerA);
                console.log(ourGame);
            }
        }
        else {
            if(ourGame.playerA) {
                console.log("removed player A")
                ourGame.playerA = null;
            }
        }
        //check for playerB in state
        const playerB = this.room.state.pongStates[ourGame.selfGameId.toString()].playerB;
        if(playerB){
            if(!ourGame.playerB) {
                console.log("inserting player b");
                ourGame.playerB = new PongPlayer(this.room.state.pongStates[this.getGame(this.ourPlayer.id).toString()].playerB);
                console.log(ourGame);
            }
        }
        else {
            if(ourGame.playerB) {
                console.log("removed player B");
                ourGame.playerB = null;
            }
        }
        //console.log("durchgelaufen");
    }
    createAuxilaryStuff() {
        const button = document.createElement("BUTTON");
        button.addEventListener("click", () => this.leave())
        button.innerHTML = "<em class = \"fa fa-times\"></em>";
        button.id = "close";
        this.buttonBar.appendChild(button);
        let p = document.createElement("p");
        p.innerText = "";
        p.style.position = "absolute";
        ourGame.p = p;
        this.interactiveBar.append(p);
        console.log("created auxilary stuffs");
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
    getHighestIndex(): number {
        let highestInt = -1;
        this.room.state.pongStates.forEach((key, value) => {
            if(parseInt(value) > highestInt){
                highestInt = parseInt(value)
                //console.log(highestInt);
            }
        });
        highestInt > -1? highestInt++: {};
        console.log("highest index:", highestInt)
        return highestInt;
    }

}
