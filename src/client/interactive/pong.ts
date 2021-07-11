
import { Room } from "colyseus.js";
import { PlayerRecord } from "../util";
import { createTextChangeRange } from "typescript";
import { State } from "../../common";
import { Interactive } from "./interactive";
import { Direction } from "../../common/util";


export class Pong extends Interactive{
    
    gameID: string;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    //PlayerIDs
    playerA: PongPlayer;
    playerB: PongPlayer;
    //B
    sizeBall: number;
    posBallX: number;
    posBallY: number;
    //definded max speed of the Ball
    velBall: number;
    //current speed vectors of the Ball
    velBallX: number;
    velBallY: number;

    sizeBat: number = 15;
    velBat: number = 5;
    posPlayerA: number = 0;
    posPlayerB: number = 0;
    room: Room<State>
    constructor(canvas: HTMLCanvasElement, room: Room<State>, players: PlayerRecord, id: string) {
        super("pong");
        this.gameID = id;
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

        room.onMessage("playerB", (client) =>{
            this.join(client.sessionId);
        })

        room.onMessage("moveUp", (client) => {
            if(this.playerB.id === client.sessionId) {
                this.playerB.move = Direction.UP;
            }
            else console.log("not player B");
            if(this.playerA.id === client.sessionId) {
                this.playerA.move = Direction.UP;
            }
        })
        room.onMessage("moveDown", (client) => {
            if(this.playerB.id === client.sessionId) {
                this.playerB.move = Direction.DOWN;
            }
            if(this.playerA.id === client.sessionId) {
                this.playerA.move = Direction.DOWN;
            }
        })
        
    }
    join(playerB: string){
        this.playerB = new PongPlayer(playerB);
        console.log("now player b");
        this.loop();
    }
    loop(){
        while(this.playerA.score + this.playerB.score <= 10){
            this.updatePos(this.playerA);
            this.updatePos(this.playerB);
            this.updateBall();
            this.paint();
        }
    }
    updatePos(player: PongPlayer) {
        if (player.move === Direction.UP){
            if(player.pos >= 0){
                player.pos -= this.velBat;
            }
            else {
                player.pos = 0;
            }
        }
        else if (player.move === Direction.DOWN) {
            if(player.pos + this.sizeBat<= 1000){
                player.pos += this.velBat;
            }
            else {
                player.pos = 1000 - this.sizeBat;
            }
        }
    }
    updateBall(){
        this.posBallX += this.velBallX;
        this.posBallY += this.velBallY;
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
