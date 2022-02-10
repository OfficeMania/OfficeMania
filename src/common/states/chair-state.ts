import { Schema, type } from "@colyseus/schema";

export class ChairState extends Schema {
    @type("string")
    playerId: string;

    @type("boolean")
    isUsed: boolean;
}
