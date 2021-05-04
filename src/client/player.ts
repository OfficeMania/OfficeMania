export var PLAYER_MOVEMENT_PER_SECOND = 10;
export var PLAYER_COLORS = ["red", "blue", "green", "yellow", "black"];

/*
 * This is a client-side Player-class. This means that the name and position
 * attributes are not synced with the server, but need to be updated when
 * a change from the server is reported (in the onAdd, onRemove, onChange methods).
 */
export interface Player {
    name: String;
    positionX: number;
    positionY: number;
}

/*
 * Updating the player's position is currently only done on the client side.
 */
export function updatePosition(player: Player, delta: number, width: number) {
    
    if(moveDown === true){
        player.positionY += PLAYER_MOVEMENT_PER_SECOND / 1000 * delta;
    }
    if(moveUp === true){
        player.positionY -= PLAYER_MOVEMENT_PER_SECOND / 1000 * delta;
    }
    if(moveLeft === true){
        player.positionX -= PLAYER_MOVEMENT_PER_SECOND / 1000 * delta;
    }
    if(moveRight === true){
        player.positionX += PLAYER_MOVEMENT_PER_SECOND / 1000 * delta;
    }
    player.positionX %= width;
    
}

let moveDown = false;
let moveUp = false;
let moveLeft = false;
let moveRight = false;

function keyPressed(e: KeyboardEvent){
    if(e.key === "s"){
        moveDown = true;
    }
    if(e.key === "w"){
        moveUp = true;
    }
    if(e.key === "a"){
        moveLeft = true;
    }
    if(e.key === "d"){
        moveRight = true;
    }
}

function keyUp(e: KeyboardEvent){
    if(e.key === "s"){
        moveDown = false;
    }
    if(e.key === "w"){
        moveUp = false;
    }
    if(e.key === "a"){
        moveLeft = false;
    }
    if(e.key === "d"){
        moveRight = false;
    }
}

document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyUp);

/*
 * If you run npm test, you will find that no test covers this function.
 */
export function untestedFunction(a: number, b: number) {
    return a + b;
}