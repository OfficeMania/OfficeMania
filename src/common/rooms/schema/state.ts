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
}

/*
 * state of whiteboard players
 */
export class WhiteboardPlayer extends Schema{
    @type({array: "number"})
    paths: ArraySchema<number> = new ArraySchema<number>();
}

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
    velBallX:number;
    @type("number")
    velBallY: number;

    @type("number")
    posPlayerA: number;

    @type("number")
    posPlayerB: number;

    //0: sizeBall, 1: sizeBat
    @type({array: "number"})
    sizes = new ArraySchema<number>();
    //maximum velocities per frame: 0: ball, 1: bat
    @type({array: "number"})
    velocities = new ArraySchema<number>();
}

export class doorState extends Schema {

    @type("string")
    playerId: string;

    @type("boolean")
    isClosed: boolean;
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
    players: MapSchema<PlayerData> = new MapSchema<PlayerData>();

    @type({array: "string"})
    playerSpritePaths = new ArraySchema<string>();

    @type({array: "string"})
    templatePaths = new ArraySchema<string>();

    @type(ConferenceData)
    conference: ConferenceData = new ConferenceData();

    @type({map: WhiteboardPlayer})
    whiteboardPlayer: MapSchema<WhiteboardPlayer> = new MapSchema<WhiteboardPlayer>();

    @type({map: PongState})
    pongStates: MapSchema<PongState> = new MapSchema<PongState>();

    @type({map: doorState})
    doorStates: MapSchema<doorState> = new MapSchema<doorState>();
}