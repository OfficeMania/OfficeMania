import { Schema, type } from "@colyseus/schema";

export class DoorState extends Schema {
    @type("string")
    playerId: string;

    @type("boolean")
    isClosed: boolean;
}
