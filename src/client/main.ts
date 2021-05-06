import { Client } from "colyseus.js";
import { Player, PLAYER_COLORS, updatePosition } from "./player";
import { InitState, joinAndSync, loadImage, PlayerRecord } from "./util";

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
     * git
     * room and ourPlayer are currently unused, but are probably of use for later
     */
    const [room, ourPlayer]: InitState = await joinAndSync(client, players);

    /*
     * Then, we wait for our image to load
     */
    let startImage: HTMLImageElement = await loadImage("/img/welcome.jpg");

    /*
     * Get the canvas element and its 2D-context
     *
     * See: https://developer.mozilla.org/de/docs/Web/HTML/Canvas
     */ 
    let canvas = $<HTMLCanvasElement>("canvas");
    let width = canvas.width;
    let height = canvas.height;
    let ctx = canvas.getContext("2d");
    

    /*
    * movement of players
    * 
    * ourPlayer = current Player
    */
    function keyPressed(e: KeyboardEvent){
        if(e.key === "s"){
            ourPlayer.moveDown = true;
        }
        if(e.key === "w"){
            ourPlayer.moveUp = true;
        }
        if(e.key === "a"){
            ourPlayer.moveLeft = true;
        }
        if(e.key === "d"){
            ourPlayer.moveRight = true;
        }
    }
    
    function keyUp(e: KeyboardEvent){
        if(e.key === "s"){
            ourPlayer.moveDown = false;
        }
        if(e.key === "w"){
            ourPlayer.moveUp = false;
        }
        if(e.key === "a"){
            ourPlayer.moveLeft = false;
        }
        if(e.key === "d"){
            ourPlayer.moveRight = false;
        }
    }
    
    document.addEventListener("keydown", keyPressed);
    document.addEventListener("keyup", keyUp);

    

    // message reciev test

    room.onMessage("skill" ,(message) => {console.log("lol")});




    /*
     * Create a gameloop-like function for drawing a simple animation
     *
     * See: https://gameprogrammingpatterns.com/game-loop.html
     */
    const MS_PER_UPDATE = 10;

    let previous = performance.now();
    let lag = 0;
    
    function loop(now: number) {
        lag += now - previous;
        previous = now;

        /*
         * Update each player's position using a fixed delta
         */

        
        while (lag >= MS_PER_UPDATE) {
            Object.values(players).forEach((player: Player) => {
                return updatePosition(player, MS_PER_UPDATE, room, client);
            });

            lag -= MS_PER_UPDATE;
        }
        
        

        /*
         * Repaint the scene
         */
        // Draw white plane
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Draw background
        ctx.drawImage(startImage, 0, 0);
        
        // Draw each player
        ctx.save();
        Object.values(players).forEach((player: Player, i: number) => {
            ctx.fillStyle = PLAYER_COLORS[i % PLAYER_COLORS.length];
            ctx.fillRect(player.positionX, player.positionY, 25, 25);
        });
        ctx.restore();

        

        // Repeat game loop
        requestAnimationFrame(loop);
    }

    // Start game loop
    requestAnimationFrame(loop);
}

main();