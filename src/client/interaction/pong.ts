import {Interactive} from "./interactive";

export class Pong extends Interactive {
    playerA: number;
    playerB: number;

    constructor(playerA: number, playerB: number) {
        super("pong");
        this.playerA = playerA;
    }
}
