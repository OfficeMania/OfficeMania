import { ArraySchema, Schema, type } from "@colyseus/schema";

/*
 *state of pong game
 */
export class PongState extends Schema {
    @type("string")
    playerA: string;

    @type("string")
    playerB: string;

    @type("number")
    posBallX: number;
    @type("number")
    posBallY: number;

    //proportional velocities
    @type("number")
    velBallX: number;
    @type("number")
    velBallY: number;

    @type("number")
    posPlayerA: number;

    @type("number")
    posPlayerB: number;

    @type("number")
    scoreA: number;

    @type("number")
    scoreB: number;

    //0: not ended, 1: host won, 2: guest won
    @type("number")
    gameEnd: number;

    //0: sizeBall, 1: sizeBat
    @type({ array: "number" })
    sizes = new ArraySchema<number>();
    //maximum velocities per frame: 0: ball, 1: bat
    @type({ array: "number" })
    velocities = new ArraySchema<number>();
}
