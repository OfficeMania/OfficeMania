import { Interaction } from "./interaction";

export class Pong extends Interaction{
    playerA: number;
    playerB: number;
    constructor(playerA: number, playerB: number) {
        super("pong");
        this.playerA = playerA;
    }
}