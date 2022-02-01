import { Schema, type } from "@colyseus/schema";

export class ChessState extends Schema {
    @type("string")
    playerWhite: string;

    @type("string")
    playerBlack: string;

    @type("string")
    configuration: string;
}
