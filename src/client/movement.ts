import {Player, syncOwnPosition, updateOwnPosition, updatePosition} from "./player";
import {Room} from "colyseus.js";
import {PlayerRecord} from "./util";
import {choosePlayerSprites} from "./drawplayer";
import {solidInfo} from "./map";

const MS_PER_UPDATE = 10;
const MS_PER_UPDATE2 = 15;

let previous = performance.now();
let lag = 0;
let lag2 = 0;
let lastSecond = performance.now();

export function playerLoop(ourPlayer: Player, players: PlayerRecord, room: Room, now: number, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, collisionInfo: solidInfo[][]) {
    lag += now - previous;
    lag2 += now - previous;
    previous = now;

    //calculate everything that needs to be calculated by the second and not the FPS
    while (lag >= MS_PER_UPDATE || lag2 >= MS_PER_UPDATE2) {

        //calculates players movement
        if (lag >= MS_PER_UPDATE) {
            //Update each player's data
            Object.values(players).forEach((player: Player) => {
                if (player !== ourPlayer) {
                    updatePosition(player, room);
                    player.character = room.state.players[player.id].character;
                    player.name = room.state.players[player.id].name;
                    player.participantId = room.state.players[player.id].participantId;
                }
            });
            //Update own player
            updateOwnPosition(ourPlayer, room, collisionInfo);

            lag -= MS_PER_UPDATE;
        }

        //animates/chooses character sprite
        if (lag2 >= MS_PER_UPDATE2) {
            Object.values(players).forEach((player: Player) => {
                choosePlayerSprites(room, player, ourPlayer);
            });
            lag2 -= MS_PER_UPDATE2;
        }
    }

    //synchronize own position with the server
    if (!lastSecond || now - lastSecond >= 100) {
        lastSecond = now;
        syncOwnPosition(ourPlayer, room);
        // console.log(ourPlayer.scaledX + 16, ourPlayer.scaledY + 67)
    }
}


