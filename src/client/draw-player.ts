import {Room} from "colyseus.js";
import {Player, STEP_SIZE} from "./player";
import {PlayerRecord} from "./util";
import {State} from "../common";
import {Direction} from "../common/util";
import AnimatedSpriteSheet from "./graphic/animated-sprite-sheet";

function calculateAnimation(player: Player) {
    let mode: string;
    let direction: Direction;
    if (player.moveDirection === null || player.changeDirection) {
        // standing animation
        mode = "standing";
        // sprite had time to turn before moving, so changeDirection can be false
        player.changeDirection = false;
        direction = player.facing;
        player.standing++;
        if (player.standing >= 10) {
            player.moving = 0
            const number = player.standing % 300;
            if (number < 200) {
                player.animationStep = number / 40 |0;
            } else {
                player.animationStep = 5;
            }
        } else {
            player.moving++
            return;
        }
    } else {
        // moving animation
        mode = "moving";
        direction = player.moveDirection;
        player.standing = 0;
        player.moving++;
        player.animationStep = (player.moving % 60) / 10 |0;
    }
    player.animationName = `${mode}-${direction}`;
}

function calculateOtherPlayer(player: Player, room: Room<State>) {
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
        player.moveDirection = null;
    } else {
        player.moveDirection = player.facing;
    }
}

/*
 * Chooses the Player sprite depending on walking direction and duration of walking/standing
 */
export function choosePlayerSprites(room: Room, player: Player, ownPlayer: Player) {
    if (ownPlayer !== player) {
        calculateOtherPlayer(player, room);
    }
    calculateAnimation(player);
}

export function drawPlayers(ourPlayer: Player, players: PlayerRecord, characters: { [key: string]: AnimatedSpriteSheet }, context: CanvasRenderingContext2D, width: number, height: number) {
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

function drawPlayer(context: CanvasRenderingContext2D, characters: { [key: string]: AnimatedSpriteSheet }, player: Player, playerX: number, playerY: number) {
    const character: AnimatedSpriteSheet = characters[player.character];
    if (character) { // Draw Player Character
        character.drawAnimationStep(context, player.animationName, player.animationStep, playerX, playerY);
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
