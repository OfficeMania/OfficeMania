import { Room } from "colyseus.js";
import { State } from "../../common";
import { PongState } from "../../common/schema/state";
import { Direction, MessageType } from "../../common/util";
import { checkInputMode } from "../main";
import { Player } from "../player";
import {
    createCloseInteractionButton,
    getOurPlayer,
    getPlayers,
    getRoom,
    PlayerRecord,
    removeCloseInteractionButton,
} from "../util";
import { Interactive } from "./interactive";
import { Pong, PongPlayer } from "./pong";
import { PongMessage } from "../../common/handler/pong-handler";

let ourGame: Pong;

export class PingPongTable extends Interactive {
    //pongs: Pong[];
    room: Room<State>;
    ourPlayer: Player;
    players: PlayerRecord;
    previousInput: Direction[];
    leavable: boolean;

    constructor() {
        super("Pong table", false, 2);
        this.room = getRoom();
        this.players = getPlayers();
        this.input = [null];
        this.previousInput = this.input;
        this.leavable = false;
    }

    onInteraction() {
        this.ourPlayer = getOurPlayer();
        this.players = getPlayers();
        if (!ourGame) {
            this.room.send(MessageType.PONG_INTERACTION, PongMessage.ON_INTERACTION);
            console.log("Pong game interaction...");
            ourGame = new Pong(this.canvas, this.room, this.players, "a");
            ourGame.canvas.style.visibility = "visible";
            ourGame.canvas.width = 1280;
            ourGame.canvas.height = 720;
            checkInputMode();
            this.initListener();
            createCloseInteractionButton(() => this.leave());
        } else {
            //console.log("already in a game");
        }
    }

    initListener() {
        this.room.onMessage(MessageType.PONG_INTERACTION, message => {
            //console.log("interatction message recieved in client " + message)
            switch (message) {
                case PongMessage.INIT: {
                    this.getPong();
                    this.leavable = true;
                    break;
                }
                case PongMessage.UPDATE: {
                    if (ourGame) {
                        ourGame.selfGameId = this.getGame(this.ourPlayer.roomId);
                        this.updateState();
                        ourGame.paint();
                    }
                    break;
                }
                case PongMessage.LEAVE: {
                    this.onLeave();
                }
                default:
                    break;
            }
        });
    }

    getPong() {
        let stateSize = this.getHighestIndex();
        this.room.state.pongStates.forEach(state => {
            if (state.playerA === this.ourPlayer.roomId || state.playerB === this.ourPlayer.roomId) {
                ourGame = this.getPongFromState(state);
            }
        });
    }

    getPongFromState(state: PongState): Pong {
        if (state) {
            let pong = new Pong(this.canvas, this.room, this.players, this.ourPlayer.roomId);
            pong.playerA = new PongPlayer(state.playerA);
            if (state.playerB) {
                pong.playerB = new PongPlayer(state.playerB);
            }
            try {
                pong.sizeBall = state.sizes.at(0);
                pong.sizeBat = state.sizes.at(1);
            } catch (e) {
                console.warn("PROPERTY HAS NOT BEEN LOADED INTO PONGSTATE");
            }
            //console.log("created a pong game");
            pong.updatePong();
            return pong;
        }
        return;
    }

    getGame(clientId: string): number {
        for (let i = 0; i < this.getHighestIndex(); i++) {
            if (
                this.room.state.pongStates[i.toString()].playerA === clientId ||
                this.room.state.pongStates[i.toString()].playerB === clientId
            ) {
                return i;
            }
        }
        //console.log("nothing found, exiting");
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
        if (this.leavable) {
            removeCloseInteractionButton();
            ourGame.canvas.style.visibility = "hidden";
            this.room.removeAllListeners();
            this.room.send(MessageType.PONG_INTERACTION, PongMessage.LEAVE);
            ourGame = null;
            checkInputMode();
        }
    }

    onLeave() {
        if (!this.room.state.pongStates[ourGame.selfGameId.toString()]) {
            this.leave();
        }
    }

    updateState() {
        //check for player A in state
        const playerA: string = this.room.state.pongStates[ourGame.selfGameId.toString()].playerA;
        if (playerA) {
            if (!ourGame.playerA) {
                ourGame.playerA = new PongPlayer(
                    this.room.state.pongStates[this.getGame(this.ourPlayer.roomId).toString()].playerA
                );
            }
        } else {
            if (ourGame.playerA) {
                ourGame.playerA = null;
            }
        }
        //check for playerB in state
        const playerB = this.room.state.pongStates[ourGame.selfGameId.toString()].playerB;
        if (playerB) {
            if (!ourGame.playerB) {
                ourGame.playerB = new PongPlayer(
                    this.room.state.pongStates[this.getGame(this.ourPlayer.roomId).toString()].playerB
                );
            }
        } else {
            if (ourGame.playerB) {
                ourGame.playerB = null;
            }
        }
    }

    updateInput() {
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
                break;
            }
        }
        if (this.input.includes(Direction.LEFT) || this.input.includes(Direction.RIGHT)) {
            let index: number = -1;
            index = this.input.indexOf(Direction.LEFT);
            if (index > -1) this.input.splice(index, 1);

            index = this.input.indexOf(Direction.RIGHT);
            if (index > -1) this.input.splice(index, 1);
        }
    }

    getHighestIndex(): number {
        let highestInt = -1;
        this.room.state.pongStates.forEach((key, value) => {
            if (parseInt(value) > highestInt) {
                highestInt = parseInt(value);
            }
        });
        highestInt > -1 ? highestInt++ : {};
        return highestInt;
    }
}
