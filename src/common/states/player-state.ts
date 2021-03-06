import { Schema, type } from "@colyseus/schema";

/*
 * Class to sync the playerdata with the server
 */
export class PlayerState extends Schema {
    @type("boolean")
    loggedIn: boolean;

    @type("string")
    userId: string;

    @type("number")
    userRole: number;

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
    
    @type("boolean")
    isSitting: boolean;
}
