import {Room} from "colyseus.js";
import {Player, STEP_SIZE} from "./player";
import {PlayerRecord} from "./util";

function playerMovingAnimation(player: Player, direction: string, playerWidth: number, playerHeight: number) {
    player.standing = 0;
    player.moving++;
    let x = 0;

    //choose direction
    switch (direction) {
        case "right": {
            break;
        }
        case "up": {
            x += 6 * playerWidth
            break;
        }
        case "left": {
            x += 12 * playerWidth
            break;
        }
        case "down": {
            x += 18 * playerWidth
            break;
        }
    }

    //moving animation
    if (player.moving % 60 <= 10) {
        //do nothing
    } else if (player.moving % 60 <= 20) {
        x += playerWidth;
    } else if (player.moving % 60 <= 30) {
        x += 2 * playerWidth;
    } else if (player.moving % 60 <= 40) {
        x += 3 * playerWidth;
    } else if (player.moving % 60 <= 50) {
        x += 4 * playerWidth;
    } else {
        x += 5 * playerWidth;
    }

    player.spriteX = x
    player.spriteY = 2 * playerHeight
}

function playerStandingAnimation(player: Player, playerHeight: number, playerWidth: number) {
    player.standing++;

    //only activates if player is standing long enough
    if (player.standing >= 10) {
        player.moving = 0
        player.spriteY = playerHeight;
        let x = 0;

        //choose direction
        switch (player.facing) {
            case "right": {
                break;
            }
            case "up": {
                x += 6 * playerWidth
                break;
            }
            case "left": {
                x += 12 * playerWidth
                break;
            }
            case "down": {
                x += 18 * playerWidth
                break;
            }
        }

        //standing animation
        if (player.standing % 300 <= 40) {
            //do nothing
        } else if (player.standing % 300 <= 80) {
            x += playerWidth;
        } else if (player.standing % 300 <= 120) {
            x += 2 * playerWidth;
        } else if (player.standing % 300 <= 160) {
            x += 3 * playerWidth;
        } else if (player.standing % 300 <= 200) {
            x += 4 * playerWidth;
        } else {
            x += 5 * playerWidth;
        }

        player.spriteX = x;
    } else {
        player.moving++
    }
}

/*
 * Chooses the Player sprite dependend on walking direction and duration of walking/standing
 */
export function choosePlayerSprites(room: Room, player: Player, playerWidth: number, playerHeight: number, ownPlayer: Player) {
    if (ownPlayer === player) {
        if (player.moveDirection === null) {
            playerStandingAnimation(player, playerHeight, playerWidth);
        } else {
            playerMovingAnimation(player, player.moveDirection, playerWidth, playerHeight);
        }
    } else { //all other players
        //sets facing direction to choose sprites
        if (Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) > Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)) {
            if (player.positionX < room.state.players[player.id].x * STEP_SIZE) {
                player.facing = "right"
            } else if (player.positionX > room.state.players[player.id].x * STEP_SIZE) {
                player.facing = "left"
            }
        } else if (Math.abs(player.positionX - room.state.players[player.id].x * STEP_SIZE) < Math.abs(player.positionY - room.state.players[player.id].y * STEP_SIZE)) {
            if (player.positionY < room.state.players[player.id].y * STEP_SIZE) {
                player.facing = "down"
            } else if (player.positionY > room.state.players[player.id].y * STEP_SIZE) {
                player.facing = "up"
            }
        }
        if (player.positionX === room.state.players[player.id].x * STEP_SIZE && player.positionY === room.state.players[player.id].y * STEP_SIZE) {
            playerStandingAnimation(player, playerHeight, playerWidth);
        } else {
            playerMovingAnimation(player, player.facing, playerWidth, playerHeight);
        }
    }
}

//sprite dimensions (from movement)
let playerWidth: number = 48;
let playerHeight: number = 96;

export function drawPlayer(ourPlayer: Player, players: PlayerRecord, characters: { [key: string]: HTMLImageElement }, ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Draw each player
    Object.values(players).forEach((player: Player, i: number) => {
        let text;
        //choose the correct sprite
        if (ourPlayer.id !== player.id) {
            //draw everyone else on their position relatively to you
            ctx.drawImage(characters[player.character], player.spriteX, player.spriteY, playerWidth, playerHeight, Math.round((width / 2) + player.positionX - ourPlayer.positionX), Math.round((height / 2) + player.positionY - ourPlayer.positionY), playerWidth, playerHeight);

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
