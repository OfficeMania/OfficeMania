/*
 * Class to sync the playerdata with the server
 */
import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
    @type("string")
    userId: string;

    @type("string")
    username: string;

    @type("string")
    displayName: string;

    @type("string")
    character: string;

    @type("number")
    x: number;

    @type("number")
    y: number;

    @type("number")
    cooldown: number;

    @type("string")
    participantId: string;
}
