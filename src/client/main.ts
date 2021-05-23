import { Client } from "colyseus.js";
import { PlayerData } from "../common/rooms/schema/state";
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



    // message recieve test

    room.onMessage("skill" ,(message) => {console.log("lol")});




    /*
     * Create a gameloop-like function for drawing a simple animation
     *
     * See: https://gameprogrammingpatterns.com/game-loop.html
     */
    const MS_PER_UPDATE = 10;

    let previous = performance.now();
    let lag = 0;
    

    //configure jitsi room and bind it to div "meet"
    const domain = 'meet.jit.si';
    const options = {
        roomName: 'namedesraums',
        height: 200,
        parentNode: document.querySelector('#meet'),
        configOverwrite: { 
            startWithAudioMuted: true,
            prejoinPageEnabled: false,
            toolbarButtons: [],
            backgroundAlpha: 1,
            hideConferenceTimer: true,
            hideConferenceSubject: true,
            disableJoinLeaveSounds: true,
            disableResponsiveTiles: true,
        },
        interfaceConfigOverwrite: { 
            DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
            DEFAULT_BACKGROUND: 'rgba(255,255,255,0)',
            VIDEO_LAYOUT_FIT: 'height',
            VIDEO_QUALITY_LABEL_DISABLED: true,
            TILE_VIEW_MAX_COLUMNS: 5,
        },
    };
    //start jitsi room
    const api = new JitsiMeetExternalAPI(domain, options);
    
    //turn off own webcam preview on the right
    api.executeCommand('toggleFilmStrip');

    
    //tile view as default
    api.addEventListener(`videoConferenceJoined`, () => {
        const listener = ({ enabled }) => {
          api.removeEventListener(`tileViewChanged`, listener);
    
          if (!enabled) {
            api.executeCommand(`toggleTileView`);
          }
        };
    
        api.addEventListener(`tileViewChanged`, listener);
        api.executeCommand(`toggleTileView`);
      });
    

    //mute/unmute button
    document.getElementById("mute_button").onclick = toggle_audio;

    //wrapper function for audio mute / unmute button
    function toggle_audio() {
        api.executeCommand('toggleAudio');
    }

    //camera toggle button
    document.getElementById("cam_button").onclick = toggle_cam;

    //wrapper function for camera toggle button
    function toggle_cam() {
        api.executeCommand('toggleVideo');
    }

    //camera toggle button
    document.getElementById("tile_button").onclick = toggle_tile;

    //wrapper function for camera toggle button
    function toggle_tile() {
        api.executeCommand('setTileView', true);
    }

    
    //log timer
    let logTimer = 0;

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
        

        logTimer++;
        if (logTimer % 10 === 0) {
            

            for (const [key, value] of Object.entries(players)) {
            
                if (value.name === ourPlayer.name) {
                    continue;
                }

                console.log(Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2));
                
                if (Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2) < 5000) {
                    console.log("Player nearby: " + value.name);
                }
            }


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