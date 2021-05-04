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
    moveDown: boolean;
    moveUp: boolean;
    moveLeft: boolean;
    moveRight: boolean;
}

/*
 * Updating the player's position is currently only done on the client side.
 */
export function updatePosition(player: Player, delta: number, width: number) {
    
    if(player.moveDown === true){
        player.positionY += PLAYER_MOVEMENT_PER_SECOND / 100 * delta;
    }
    if(player.moveUp === true){
        player.positionY -= PLAYER_MOVEMENT_PER_SECOND / 100 * delta;
    }
    if(player.moveLeft === true){
        player.positionX -= PLAYER_MOVEMENT_PER_SECOND / 100 * delta;
    }
    if(player.moveRight === true){
        player.positionX += PLAYER_MOVEMENT_PER_SECOND / 100 * delta;
    }
    player.positionX %= width;
    
}




function keyPressed(e: KeyboardEvent){
    if(e.key === "s"){
        this.moveDown = true;
    }
    if(e.key === "w"){
        this.moveUp = true;
    }
    if(e.key === "a"){
        this.moveLeft = true;
    }
    if(e.key === "d"){
        this.moveRight = true;
    }
}

function keyUp(e: KeyboardEvent){
    if(e.key === "s"){
        this.moveDown = false;
    }
    if(e.key === "w"){
        this.moveUp = false;
    }
    if(e.key === "a"){
        this.moveLeft = false;
    }
    if(e.key === "d"){
        this.moveRight = false;
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