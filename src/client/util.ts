import { Client, Room } from "colyseus.js";
import { State } from "../common";
import { Player } from "./player";

export type InitState = [Room<State>, Player];
export type PlayerRecord = {[key: string]: Player}


/*
 * This function returns a promise that is resolve when the image is loaded
 * from the url. Note that this function currently does no error handling.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        let image = new Image();
        image.addEventListener("load", () => {
            resolve(image);
        });
        image.src = url;
    });
}

/*
 * This method joins a server room and initializes the synchronization between
 * the server state and the client state. The sync-initialization MUST happen
 * immediately after we join the server (i.e. in this function), because on each
 * update colyseus only sends differences. Thus, if we miss the initial update,
 * we work on incomplete data. 
 * 
 * This function is asynchronous and returns a promise: Once the server confirms
 * that we joined the room and adds our player to its state, the promise is
 * resolved.
 * 
 * See: https://docs.colyseus.io/client/client/#joinorcreate-roomname-string-options-any
 */
export async function joinAndSync(client: Client, players: PlayerRecord): Promise<InitState> {
    return client.joinOrCreate<State>("turoom").then((room) => {
        return new Promise((resolve) => {
            /*
            * This method is called when the server adds new players to its state.
            * To keep synced to the server state, we save the newly added player...
            *
            * See: https://docs.colyseus.io/state/schema/#onadd-instance-key
            */
            room.state.players.onAdd = function (playerData, sessionId) {
                console.log("Add", sessionId, playerData);

                let player: Player = {
                    id: sessionId,
                    name: "",
                    character: "Adam_48x48.png",
                    positionX: 0,
                    positionY: 0,
                    scaledX: 0,
                    scaledY: 0,
                    lastScaledX: [0,0,0,0,0],
                    lastScaledY: [0,0,0,0,0],
                    moveDirection: null,
                    moveTime: 0,
                    prioDirection: [],
                    facing: "down",
                    standing: 0,
                    moving: 0,
                    spriteX: 144,
                    spriteY: 0
                };
                players[sessionId] = player;

                
                
                /*
                 * If the sessionId of the added player and the room's session id
                 * are equal, the server added our player. Now, the room and our
                 * player are initizialed and we can resolve the promise.
                 */
                if (sessionId === room.sessionId) {
                    resolve([room, player]);
                }

                
            };


            /*
            * ... but once a player becomes inactive (according to the server) we
            * also delete it from our record
            *
            * See: https://docs.colyseus.io/state/schema/#onremove-instance-key
            */
            room.state.players.onRemove = function (_, sessionId) {
                console.log("Remove", sessionId);
                delete players[sessionId];
            };


            /*
             * If the room has any other state that needs to be observed, the
             * code needs to be placed here:
             * 
             * ...
             */
            

        });
    });
}

