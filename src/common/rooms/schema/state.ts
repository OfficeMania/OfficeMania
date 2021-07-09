import {ArraySchema, MapSchema, Schema, type} from "@colyseus/schema";

export class ConferenceData extends Schema {
    @type("string")
    id: string;

    @type("string")
    password: string;

    @type("string")
    serverParticipantId: string;
}



/*
 * Class to sync the playerdata with the server
 */
export class PlayerData extends Schema {
    @type("string")
    name: string;

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

    @type({array: "number"})
    paths: ArraySchema<number> = new ArraySchema<number>();
}

/*
 * The state of a room. Each variable that is annotated with a @type decorator
 * automatically gets synced with the clients.
 *
 * See: https://docs.colyseus.io/state/schema/
 *
 * Note: Watching for changes only happens in a shallow fashion as far as I know.
 * So if you try to nest multiple Array- / MapSchema-objects, you might find that
 * your onChange-callback might not be called (although the state technically
 * changed). The solution for this is to add an onAdd, onRemove, onChange listener
 * to every schema.
 */
export class State extends Schema {
    @type({map: PlayerData})
    players = new MapSchema<PlayerData>();

    @type({array: "string"})
    playerSpritePaths = new ArraySchema<string>();

    @type({array: "string"})
    templatePaths = new ArraySchema<string>();

    @type(ConferenceData)
    conference: ConferenceData = new ConferenceData();
}

/*
 *state of pong game 
 */
export class PongState extends Schema {
    //0: xBall, 1: yBall, 2: playerA, 3: playerB
    @type({array: "number"})
    positions = new ArraySchema<number>();

    @type("number")
    sizeBall: number;
    
    @type("number")
    sizeBat: number;
}