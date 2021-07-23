import {Room} from "colyseus.js";
import {Player, STEP_SIZE} from "./player";
import {PlayerRecord} from "./util";
import {State} from "../common";
import {Direction} from "../common/util";

function playerMovingAnimation(player: Player, direction: string, width: number, height: number) {
    player.standing = 0;
    player.moving++;
    let x = 0;

    //choose direction
    switch (direction) {
        case Direction.RIGHT: {
            break;
        }
        case Direction.UP: {
            x += 6 * width
            break;
        }
        case Direction.LEFT: {
            x += 12 * width
            break;
        }
        case Direction.DOWN: {
            x += 18 * width
            break;
        }
    }

    //moving animation
    if (player.moving % 60 <= 10) {
        //do nothing
    } else if (player.moving % 60 <= 20) {
        x += width;
    } else if (player.moving % 60 <= 30) {
        x += 2 * width;
    } else if (player.moving % 60 <= 40) {
        x += 3 * width;
    } else if (player.moving % 60 <= 50) {
        x += 4 * width;
    } else {
        x += 5 * width;
    }

    player.spriteX = x
    player.spriteY = 2 * height
}

function playerStandingAnimation(player: Player, width: number, height: number) {
    player.standing++;

    //only activates if player is standing long enough
    if (player.standing >= 10) {
        player.moving = 0
        player.spriteY = height;
        let x = 0;

        //choose direction
        switch (player.facing) {
            case Direction.RIGHT: {
                break;
            }
            case Direction.UP: {
                x += 6 * width
                break;
            }
            case Direction.LEFT: {
                x += 12 * width
                break;
            }
            case Direction.DOWN: {
                x += 18 * width
                break;
            }
        }

        //standing animation
        if (player.standing % 300 <= 40) {
            //do nothing
        } else if (player.standing % 300 <= 80) {
            x += width;
        } else if (player.standing % 300 <= 120) {
            x += 2 * width;
        } else if (player.standing % 300 <= 160) {
            x += 3 * width;
        } else if (player.standing % 300 <= 200) {
            x += 4 * width;
        } else {
            x += 5 * width;
        }

        player.spriteX = x;
    } else {
        player.moving++
    }
}

function chooseOwnPlayerSprite(player: Player) {
    if (player.moveDirection === null) {
        playerStandingAnimation(player, playerWidth, playerHeight);
    } else {
        playerMovingAnimation(player, player.moveDirection, playerWidth, playerHeight);
    }
}

function chooseOtherPlayerSprite(player: Player, room: Room<State>) {
    //sets facing direction to choose sprites
    if (Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) > Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)) {
        if (player.positionX < room.state.players[player.id].x * STEP_SIZE) {
            player.facing = Direction.RIGHT
        } else if (player.positionX > room.state.players[player.id].x * STEP_SIZE) {
            player.facing = Direction.LEFT
        }
    } else if (Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) < Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)) {
        if (player.positionY < room.state.players[player.id].y * STEP_SIZE) {
            player.facing = Direction.DOWN
        } else if (player.positionY > room.state.players[player.id].y * STEP_SIZE) {
            player.facing = Direction.UP
        }
    }
    if (player.positionX === room.state.players[player.id].x * STEP_SIZE && player.positionY === room.state.players[player.id].y * STEP_SIZE) {
        playerStandingAnimation(player, playerWidth, playerHeight);
    } else {
        playerMovingAnimation(player, player.facing, playerWidth, playerHeight);
    }
}

/*
 * Chooses the Player sprite depending on walking direction and duration of walking/standing
 */
export function choosePlayerSprites(room: Room, player: Player, ownPlayer: Player) {
    if (ownPlayer === player) {
        chooseOwnPlayerSprite(player);
    } else {
        chooseOtherPlayerSprite(player, room);
    }
}

//sprite dimensions (from movement)
const playerWidth: number = 48;
const playerHeight: number = 96;

export function drawPlayers(ourPlayer: Player, players: PlayerRecord, characters: { [key: string]: HTMLImageElement }, context: CanvasRenderingContext2D, width: number, height: number) {
    // Draw every else Player
    Object.values(players).filter(player => player.id !== ourPlayer.id).forEach((player: Player) => {
        // Draw everyone else on their Position relatively to you
        const playerX: number = Math.round((width / 2) + player.positionX - ourPlayer.positionX);
        const playerY: number = Math.round((height / 2) + player.positionY - ourPlayer.positionY);
        drawPlayer(context, characters, player, playerX, playerY);
    });
    // Draw our Player
    moveBackground(context, ourPlayer);
    // Draw yourself always at the same Position
    drawPlayer(context, characters, ourPlayer, Math.round(width / 2), Math.round(height / 2));
}

function moveBackground(context: CanvasRenderingContext2D, player: Player) {
    // Offset Background so that it stays with the Map
    document.documentElement.style.setProperty("--bg-offset-x", "" + (-player.positionX % 256) + "px");
    document.documentElement.style.setProperty("--bg-offset-y", "" + (-player.positionY % 256) + "px");
}

function drawPlayer(context: CanvasRenderingContext2D, characters: { [key: string]: HTMLImageElement }, player: Player, playerX: number, playerY: number) {
    if (characters[player.character]) {
        // Draw Player Character
        context.drawImage(characters[player.character], player.spriteX, player.spriteY, playerWidth, playerHeight, playerX, playerY, playerWidth, playerHeight);
    }
    context.font = '18px Arial';
    context.textAlign = "center";
    // Draw Player Name Box
    const textMetrics = context.measureText(player.name);
    context.fillStyle = "rgba(100, 100, 100, 0.5)";
    context.fillRect(playerX - textMetrics.width / 2 + 20, playerY - 4, textMetrics.width + 8, 24);
    // Draw Player Name
    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.fillText(player.name, playerX + 24, playerY + 12);
}
