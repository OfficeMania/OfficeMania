import {Room} from "colyseus.js";
import {PlayerRecord} from "../util";
import {State} from "../../common";
import {PongState} from "../../common/rooms/schema/state";

export class Pong {

    selfGameId: number = -1;
    inGame = false;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    //PlayerIDs
    playerA: PongPlayer;
    playerB: PongPlayer;

    sizeBall: number;
    posBallX: number;
    posBallY: number;

    sizeBat: number = 100;
    room: Room<State>

    constructor(canvas: HTMLCanvasElement, room: Room<State>, players: PlayerRecord, id: string) {
        this.playerA = new PongPlayer(id);
        this.canvas = canvas;
        this.room = room;
        //this.canvas.style.visibility = "visible";
        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(5, 5, 10, this.sizeBat)
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(this.canvas.width - 15, this.canvas.height - 5 - this.sizeBat, 10, this.sizeBat)
        this.loop();
    }

    loop() {
        this.updatePos();
        this.paint();
        //this.room.send(MessageType.INTERACTION, PongMessage.END);
    }

    updatePos() {
        let currentState: PongState;
        if (this.selfGameId !== -1) {
            currentState = this.room.state.pongStates[this.selfGameId.toString()]
        } else {
            console.log("still no");
        }
        if (currentState) {
            if (currentState.playerB && this.playerB) {
                this.playerB.pos = currentState.posPlayerB;
                console.log(this.playerB.pos + " playerB");
            }
            if (currentState.playerA && this.playerA) {
                this.playerA.pos = currentState.posPlayerA;
                console.log(this.playerA.pos + "PlayerA");
            }
            this.posBallX = currentState.posBall.at(0);
            this.posBallY = currentState.posBall.at(1);
        }
    }

    paint() {
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black";
        this.ctx.strokeRect(5, 5, this.canvas.width - 5, this.canvas.height - 5);
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(5, this.playerA.pos, 10, this.sizeBat);
        if (this.playerB) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(this.canvas.width - 15, this.playerB.pos, 10, this.sizeBat);
        }
    }

}

export class PongPlayer {

    private _id: string;
    private _score: number;
    private _pos: number;

    constructor(id: string) {
        this._id = id;
        this._score = 0;
        this._pos = 0;
    }

    get id(): string {
        return this._id;
    }

    set id(id: string) {
        this._id = id;
    }

    get score(): number {
        return this._score;
    }

    set score(score: number) {
        this._score = score;
    }

    get pos(): number {
        return this._pos;
    }

    set pos(pos: number) {
        this._pos = pos;
    }

}
