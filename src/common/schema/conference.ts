import { Schema, type } from "@colyseus/schema";

export class Conference extends Schema {
    @type("string")
    id: string;

    @type("string")
    password: string;

    @type("string")
    serverParticipantId: string;
}
