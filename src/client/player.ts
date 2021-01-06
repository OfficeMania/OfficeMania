export var PLAYER_MOVEMENT_PER_SECOND = 10;
export var PLAYER_COLORS = ["red", "blue", "green", "yellow", "black"];

/*
 * This is a client-side Player-class. This means that the name and position
 * attributes are not synced with the server, but need to be updated when
 * a change from the server is reported (in the onAdd, onRemove, onChange methods).
 */
export interface Player {
    name: String;
    position: number;
}

/*
 * Updating the player's position is currently only done on the client side.
 */
export function updatePosition(player: Player, delta: number, width: number) {
    player.position += PLAYER_MOVEMENT_PER_SECOND / 1000 * delta;
    player.position %= width;
}

/*
 * If you run npm test, you will find that no test covers this function.
 */
export function untestedFunction(a: number, b: number) {
    return a + b;
}