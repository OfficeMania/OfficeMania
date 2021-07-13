import {Room} from "colyseus.js";
import {PlayerRecord} from "../util";
import {State} from "../../common";
import {Interactive} from "./interactive";
import {Direction, MessageType} from "../../common/util";


export class Pong{

    selfGameId: string;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    //PlayerIDs
    playerA: PongPlayer;
    playerB: PongPlayer;

    sizeBall: number;
    posBallX: number;
    posBallY: number;

    sizeBat: number = 15;
    posPlayerA: number = 0;
    posPlayerB: number = 0;
    room: Room<State>
    constructor(canvas: HTMLCanvasElement, room: Room<State>, players: PlayerRecord, id: string) {
        this.playerA = new PongPlayer(id);
        this.canvas = canvas;
        //this.canvas.style.visibility = "visible";
        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle ="black";
        this.ctx.fillRect(5, 5, 10, this.sizeBat)
        this.ctx.fillStyle ="black";
        this.ctx.fillRect(this.canvas.width-15, this.canvas.height-5-this.sizeBat, 10, this.sizeBat)
        this.loop();

    }
    loop(){
        let gameOn = true;
        if(gameOn){
            this.updatePos();
            this.paint();
            if(this.playerB) {

            }
        }
        this.room.send(MessageType.INTERACTION, "pong-stop");
    }
    updatePos() {
        let currentState = this.room.state.pongStates.get(this.selfGameId);
        if (currentState) {
            this.posBallX = currentState.posBall[0];
            this.posBallY = currentState.posBall[1];
            this.posPlayerA = currentState.posPlayerA;
            if (this.playerB) {
                this.posPlayerB = currentState.posPlayerB;
            }
        }
    }
    
    paint(){
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle ="black";
        this.ctx.fillRect(5, this.playerA.pos, 5, this.sizeBat);
        if (this.playerB) {
            this.ctx.fillStyle ="black";
            this.ctx.fillRect(this.canvas.width-10, this.playerB.pos, 5, this.sizeBat);
        }

    }
}
export class PongPlayer {
    private _id: string;
    private _score: number;
    private _pos: number;

    constructor(id: string){
        this._id = id;
        this._score = 0;
        this._pos = 0;
    }
    get id(): string{
        return this._id;
    }
    set id(id: string) {
        this._id = id;
    }
    get score(): number{
        return this._score;
    }
    set score(score: number) {
        this._score = score;
    }
    get pos(): number {
        return this._pos;
    }
    set pos(pos: number){
        this._pos = pos;
    }

}
