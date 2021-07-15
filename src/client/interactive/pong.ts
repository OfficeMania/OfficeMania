import {Room} from "colyseus.js";
import {PlayerRecord} from "../util";
import {State} from "../../common";
import {PongState} from "../../common/rooms/schema/state";

export class Pong {

    selfGameId: number = -1;
    inGame = false;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    p: HTMLParagraphElement;
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
        this.updatePong();
        this.paint();
        //this.room.send(MessageType.INTERACTION, PongMessage.END);
    }

    updatePong() {
        let currentState: PongState;
        if (this.selfGameId !== -1) {
            currentState = this.room.state.pongStates[this.selfGameId.toString()]
        } else {
            console.log("still no");
        }
        if(currentState) {
            if (currentState.playerB && this.playerB){
                this.playerB.pos = currentState.posPlayerB;
                this.playerB.score = currentState.scoreB;
                //console.log(this.playerB.pos + " playerB");
            }
            if (currentState.playerA && this.playerA){
                this.playerA.pos = currentState.posPlayerA;
                this.playerA.score = currentState.scoreA;
                //console.log(this.playerA.pos + "PlayerA");
            }
            this.posBallX = currentState.posBallX;
            this.posBallY = currentState.posBallY;
        }
    }

    paint() {
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle ="white";
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        if(this.playerA){
            this.ctx.fillStyle ="white";
            this.ctx.fillRect(0, this.playerA.pos, 15, this.sizeBat);
            //console.log("painting a");
            //console.log(this.playerA);
        }
        if (this.playerB) {
            this.ctx.fillStyle ="white";
            this.ctx.fillRect(this.canvas.width-15, this.playerB.pos, 20, this.sizeBat);
            //console.log("painting b");
            //console.log(this.playerB);
        }
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(this.posBallX - (this.sizeBall/2), this.posBallY -(this.sizeBall/2), this.sizeBall/2, this.sizeBall);
        if (this.p && this.playerA && this.playerB) {
            let scoreTab: string = this.playerA.score.toString();
            scoreTab += " : ";
            scoreTab += this.playerB.score.toString();
            this.p.innerText = scoreTab;
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
