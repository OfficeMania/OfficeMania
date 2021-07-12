import {Room} from "colyseus.js";
import {PlayerRecord} from "../util";
import {State} from "../../common";
import {Interactive} from "./interactive";
import {Direction, MessageType} from "../../common/util";


export class Pong{

    
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
        this.canvas.style.visibility = "visible";
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
        while(this.playerA.score + this.playerB.score <= 10){
            this.updatePos();
            this.paint();
        }
        this.room.send(MessageType.INTERACTION, "pong-stop");
    }
    updatePos() {
        let currentState = this.room.state.pongStates[this.getGame(this.playerA)];
        if (currentState) {
            this.posBallX = currentState.posBall[0];
            this.posBallY = currentState.posBall[1];
            this.posPlayerA = currentState.posPlayerA;
            this.posPlayerB = currentState.posPlayerB;
        }
    }
    getGame(client): number{
        for(let i = 0; i < this.room.state.pongStates.size; i++) {
            if (this.room.state.pongStates[i.toString()].playerIds[0] === client.sessionId || this.room.state.pongStates[i.toString()].playerIds[1] === client.sessionId){
                return i;
            }
        }
        return -1;
    }
    paint(){
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle ="black";
        this.ctx.fillRect(5, this.playerA.pos, 5, this.sizeBat)
        this.ctx.fillStyle ="black";
        this.ctx.fillRect(this.canvas.width-10, this.playerB.pos, 5, this.sizeBat)
    }
}
class PongPlayer {
    private _id: string;
    private _move: Direction;
    private _score: number;
    private _pos: number;

    constructor(id: string){
        this._id = id;
        this._move = null;
        this._score = 0;
        this._pos = 0;
    }
    get id(): string{
        return this._id;
    }
    set id(id: string) {
        this._id = id;
    }
    get move(): Direction{
        return this._move;
    }
    set move(move: Direction) {
        this._move = move;
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
