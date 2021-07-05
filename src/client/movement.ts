import {Player, syncOwnPosition, updateOwnPosition, updatePosition} from "./player";
import {Room} from "colyseus.js";
import {getCharacter, getUsername, loadImage, PlayerRecord, setCharacter, setUsername} from "./util";
import {choosePlayerSprites} from "./player_sprite";
import {solidInfo} from "./map";
import {setShowParticipantsTab} from "./conference/conference";

let yPressed: boolean = false;
let keysDisabled: boolean = false;

export function setKeysDisabled(disabled: boolean) {
    keysDisabled = disabled;
}

function onKey(event: KeyboardEvent, key: string, runnable: () => void) {
    if (event.key.toLowerCase() === key.toLowerCase()) {
        runnable();
    }
}

function onKeyDirection(event: KeyboardEvent, key: string, ourPlayer: Player = undefined, direction: string = undefined) {
    if (event.key.toLowerCase() === key.toLowerCase() && !ourPlayer.prioDirection.includes(direction)) {
        ourPlayer.prioDirection.unshift(direction);
    }
}

export function loadInputFunctions(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }) {

    function onKeyDown(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        onKeyDirection(e, "s", ourPlayer, "moveDown");
        onKeyDirection(e, "w", ourPlayer, "moveUp");
        onKeyDirection(e, "a", ourPlayer, "moveLeft");
        onKeyDirection(e, "d", ourPlayer, "moveRight");
        //iterate through characters
        onKey(e, "c", () => {
            const filenames = Object.keys(characters);
            let nextIndex = filenames.indexOf(ourPlayer.character) + 1;
            if (filenames.length <= nextIndex) {
                nextIndex = 0;
            }
            setCharacter(filenames[nextIndex], ourPlayer, room, characters);
        });
        //rename players name
        onKey(e, "r", () => setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy"), ourPlayer, room));
        //player interacts with object in front of him
        onKey(e, " ", () => {
            //(triggered with space)
        });
        onKey(e, "y", () => {
            if (!yPressed) {
                console.log("Y has been pressed"); //DEBUG
                yPressed = true;
                setShowParticipantsTab(true);
            }
        });
    }

    function onKeyUp(e: KeyboardEvent) {
        if (keysDisabled) {
            return;
        }
        onKey(e, "s", () => ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveDown"), 1));
        onKey(e, "w", () => ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveUp"), 1));
        onKey(e, "a", () => ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveLeft"), 1));
        onKey(e, "d", () => ourPlayer.prioDirection.splice(ourPlayer.prioDirection.indexOf("moveRight"), 1));
        onKey(e, "y", () => {
            yPressed = false;
            setShowParticipantsTab(false);
        });
    }

    //gets called when window is out auf focus
    function onBlur() {
        //stops player
        ourPlayer.prioDirection = [];
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
}

export async function loadCharacter(ourPlayer: Player, room: Room, characters: { [key: string]: HTMLImageElement }) {
    //load or ask for name
    const username = getUsername();
    if (username && username !== "") {
        setUsername(username, ourPlayer, room);
    } else {
        setUsername(window.prompt("Gib dir einen Namen (max. 20 Chars)", "Jimmy")?.slice(0, 20) || "Jimmy", ourPlayer, room);
    }

    //loads character sprite paths from the server (from movement)
    for (let path of room.state.playerSpritePaths) {
        characters[path] = await loadImage("/img/characters/" + path);
    }


    //load character
    const character = getCharacter();
    if (character && character !== "") {
        setCharacter(character, ourPlayer, room, characters);
    }
}

const MS_PER_UPDATE = 10;
const MS_PER_UPDATE2 = 15;

//sprite dimensions (from movement)
let playerWidth: number = 48;
let playerHeight: number = 96;

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
                choosePlayerSprites(room, player, playerWidth, playerHeight, ourPlayer);
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
