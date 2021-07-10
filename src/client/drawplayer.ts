import {Room} from "colyseus.js";
import {Player, STEP_SIZE} from "./player";
import {Direction, PlayerRecord} from "./util";
import {State} from "../common";

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

export function drawPlayer(ourPlayer: Player, players: PlayerRecord, characters: { [key: string]: HTMLImageElement }, ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Draw each player
    Object.values(players).forEach((player: Player, i: number) => {
        let text;
        //choose the correct sprite
        if (ourPlayer.id !== player.id) {
            //draw everyone else on their position relatively to you
            if (characters[player.character]) {
                ctx.drawImage(characters[player.character], player.spriteX, player.spriteY, playerWidth, playerHeight, Math.round((width / 2) + player.positionX - ourPlayer.positionX), Math.round((height / 2) + player.positionY - ourPlayer.positionY), playerWidth, playerHeight);
            }

            //draw name
            ctx.font = '18px Arial';
            ctx.textAlign = "center";

            text = ctx.measureText(player.name);
            ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
            ctx.fillRect(Math.round((width / 2) + player.positionX - ourPlayer.positionX) - text.width / 2 + 20, Math.round((height / 2) + player.positionY - ourPlayer.positionY) - 4, text.width + 8, 24);

            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.fillText(player.name, Math.round((width / 2) + player.positionX - ourPlayer.positionX) + 24, Math.round((height / 2) + player.positionY - ourPlayer.positionY) + 12)
        } else {
            //draw yourself always at the same position
            ctx.drawImage(characters[player.character], player.spriteX, player.spriteY, playerWidth, playerHeight, Math.round(width / 2), Math.round(height / 2), playerWidth, playerHeight);

            //draw name
            ctx.font = '18px Arial';
            ctx.textAlign = "center";

            text = ctx.measureText(player.name);
            ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
            ctx.fillRect(Math.round(width / 2) - text.width / 2 + 20, Math.round(height / 2) - 4, text.width + 8, 24);

            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.fillText(player.name, Math.round(width / 2) + 24, Math.round(height / 2) + 12)

        }
    });
}
