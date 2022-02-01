import { Schema, type } from "@colyseus/schema";

export class ConferenceState extends Schema {
    @type("string")
    id: string;

    @type("string")
    password: string;

    @type("string")
    serverParticipantId: string;
}
