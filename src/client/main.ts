import { Client } from "colyseus.js";
import { Player, PLAYER_COLORS, updatePosition } from "./player";
import { InitState, joinAndSync, loadImage, PlayerRecord } from "./util";
import { convertMapData, drawMapWithChunks, mapInfo } from "./map";

// A simple helper function
function $<T extends HTMLElement>(a: string) { return <T>document.getElementById(a); }

// async is necessary here, because we use 'await' to resolve the promises
async function main() {
    /*
     * We communicate to our server via WebSockets (ws-protocol instead of http)
     */
    let host = window.document.location.host.replace(/:.*/, '');
    let protocol = location.protocol.replace("http", "ws") + "//";
    let portSuffix = (location.port ? ':' + location.port : '');
    let client = new Client(protocol + host + portSuffix);

    // Keep track of all (active) players
    let players: PlayerRecord = {};

    /*
     * Before we can launch our main functionality, we need to join a room and
     * wait for our player to be available to the server.
     * 
     * room and ourPlayer are currently unused, but are probably of use for later
     */
    const [room, ourPlayer]: InitState = await joinAndSync(client, players);

    let canvas = $<HTMLCanvasElement>("canvas");

    let xml = new XMLHttpRequest();
    xml.open("GET", "/map/Map.json", false);
    xml.send(null);

    let map: Promise<mapInfo> = convertMapData(xml.responseText, room, canvas);

    let currentMap = new mapInfo((await map).layers, (await map).tilesets, (await map).canvas, (await map).resolution, (await map).textures);

    let posX: number = -11;
    let posY: number = -8;

    currentMap.updatePos(posX, posY);
    currentMap.updateScaling(1);

    drawMapWithChunks(currentMap);
}

main();