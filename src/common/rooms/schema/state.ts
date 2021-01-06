import { Schema, type, MapSchema } from "@colyseus/schema";

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
    @type({map: "string"})
    players = new MapSchema<String>();
}