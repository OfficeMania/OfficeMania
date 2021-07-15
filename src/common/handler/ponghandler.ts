import {Direction, MessageType} from "../util";
import {PongState, State} from "../rooms/schema/state";
import {Client, Room} from "colyseus";
import {Handler} from "./handler";

export enum PongMessage {
    ON_INTERACTION = "pong",
    INIT = "pong-init",
    UPDATE = "pong-update",
    LEAVE = "pong-leave",
    END = "pong-end"
}
const batSections: number[] = [-0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1,  0.2, 0.3, 0.4, 0.5]
let hasScored: boolean = false;
export class PongHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.PONG_INTERACTION, (client, message) => onPongInteraction(this.room, client, message));
        this.room.onMessage(MessageType.PONG_MOVE, (client, message) => onPongMove(this.room, client, message));
        this.room.onMessage(MessageType.PONG_UPDATE, (client) => onPongUpdate(client, this.room))
    }

    onJoin(client: Client) {
        //Nothing
    }

    onLeave(client: Client, consented: boolean) {
        leavePongGame(this.room, client);
    }

    onDispose() {
        //Nothing?
    }

}

function onPongInteraction(room: Room<State>, client, message: PongMessage) {
    switch (message) {
        case PongMessage.ON_INTERACTION: {
            let inGame: number = getPongGame(room, client);
            if (inGame === -1) {
                let emptyGame = getEmptyPongGame(room);
                console.log("empty game: " + emptyGame);
                if (emptyGame !== -1) {
                    let emptyState: PongState = room.state.pongStates[emptyGame.toString()];
                    if (emptyState) {
                        if (!emptyState.playerA) {
                            emptyState.playerA = client.sessionId;
                            emptyState.posPlayerA = 360 - (emptyState.sizes.at(1) / 2)
                        }
                        if (!emptyState.playerB) {
                            emptyState.playerB = client.sessionId;
                            emptyState.posPlayerB = 360 - (emptyState.sizes.at(1) / 2)
                        }
                    }
                } else {
                    initNewState(room, client);
                }
            }
            setTimeout(() => client.send(MessageType.PONG_INTERACTION, PongMessage.INIT), 1000);
            setTimeout(() => room.clients.forEach((client) => client.send(MessageType.PONG_INTERACTION, PongMessage.UPDATE)), 1000);
            break;
        }
        case PongMessage.END: {
            let inGame: number = getPongGame(room, client);
            if (inGame !== -1) {
                room.state.pongStates.delete(inGame.toString());
            }
            break;
        }
        case PongMessage.LEAVE: {
            leavePongGame(room, client);
            break;
        }
        case PongMessage.INIT:
        case PongMessage.UPDATE:
            break;
        default: {
            console.log("type of interaction not defined in the turoom onMessage(MessageType.INTERACTION): " + message);
        }
    }
}

function onPongMove(room: Room<State>, client, message) {
    const gameState: PongState = room.state.pongStates[getPongGame(room, client).toString()]
    if (!gameState) {
        return;
    }
    if (gameState.playerA === client.sessionId) {
        onPongMovePlayer(message, gameState, gameState.posPlayerA, (newPos: number) => gameState.posPlayerA = newPos);
    } else if (gameState.playerB === client.sessionId) {
        onPongMovePlayer(message, gameState, gameState.posPlayerB, (newPos: number) => gameState.posPlayerB = newPos);
    }
}

function onPongMovePlayer(message: string, gameState: PongState, pos: number, callback: (newPos: number) => void) {
    switch (message) {
        case Direction.UP: {
            if (pos > 0) {
                callback(pos - gameState.velocities.at(1));
            } else {
                callback(0);
            }
            break;
        }
        case Direction.DOWN: {
            if (pos + gameState.sizes.at(1) < 720) {
                callback(pos + gameState.velocities.at(1));
            } else {
                callback(720 - gameState.sizes.at(1));
            }
            break;
        }
    }
}

function initNewState(room: Room<State>, client: Client) {
    console.log("creating new pongstate");
                    console.log(getNextPongSlot(room));
                    let ar = getNextPongSlot(room);
                    let newState = new PongState();
                    newState.playerA = client.sessionId;
                    newState.velocities.push(10, 10);
                    newState.sizes.push(30, 150)
                    newState.posPlayerA = 360 - (newState.sizes.at(1) / 2);
                    newState.velBallX = 0.8;
                    newState.velBallY = 0.2;
                    newState.posBallX = 640-(newState.sizes.at(0)/2);
                    newState.posBallY = 320-(newState.sizes.at(0)/2);
                    newState.scoreA = 0;
                    newState.scoreB = 0;
                    room.state.pongStates[ar.toString()] = newState;
                    console.log(room.state.pongStates[ar.toString()].posPlayerA);
}

function leavePongGame(room: Room<State>, client: Client) {
    const n = getPongGame(room, client);
    if (n === -1) {
        return;
    }
    const game: PongState = room.state.pongStates[n.toString()];
    if (game.playerA === client.sessionId) {
        game.playerA = null;
    } else {
        game.playerB = null;
    }
    if (game.playerA === null && game.playerB === null) {
        room.state.pongStates.delete(n.toString());
    }
    setTimeout(() => room.clients.forEach((client) => client.send(MessageType.PONG_UPDATE, "pong-update")), 1000)
}



function getPongGame(room: Room<State>, client): number {
    for (let i = 0; i < room.state.pongStates.size; i++) {
        if (room.state.pongStates[i.toString()].playerA === client.sessionId || room.state.pongStates[i.toString()].playerB === client.sessionId) {
            return i;
        }
    }
    return -1;
}

function getEmptyPongGame(room: Room<State>): number {
    if (!room.state.pongStates.size) {
        return -1;
    }
    for (let i = 0; i < room.state.pongStates.size; i++) {
        const playerA = room.state.pongStates[i.toString()].playerA;
        const playerB = room.state.pongStates[i.toString()].playerB;
        console.debug("playerA=", playerA);
        console.debug("playerB=", playerB);
        if (!playerA || !playerB){
            return i;
        }
    }
    return -1;
}

function getNextPongSlot(room: Room<State>): number {
    if (!room.state.pongStates.size) {
        return 0;
    }
    for (let i = 0; i <= room.state.pongStates.size; i++) {
        if (!room.state.pongStates[i.toString()]) {
            return i;
        }
    }
    return -1;
}
function onPongUpdate(client: Client, room: Room<State>) {
    const gameState: PongState = room.state.pongStates[getPongGame(room, client).toString()];
    let posX = gameState.posBallX;
    let posY = gameState.posBallY;
    posX += gameState.velBallX * gameState.velocities.at(0);
    //console.log(posX);
    posY += gameState.velBallY * gameState.velocities.at(0);
    if (posY > 720 - gameState.sizes.at(0)/2 || posY < 0 + gameState.sizes.at(0)/2) {
        gameState.velBallY *= -1;
    }
    gameState.posBallY = posY;
    if(hasScored) {
        return;
    }
    if (posX > 1380 - gameState.sizes.at(0)/2) { 
        if(gameState.playerB){
            gameState.scoreB++;
            hasScored = true;
            startNextRound(gameState);
        }
        else gameState.velBallX *= -1;
        
        //console.log("hit the wall")
    }
    else if(posX < -100 + gameState.sizes.at(0)/2) {
        if(gameState.playerA){
            gameState.scoreA++;
            hasScored = true;
            startNextRound(gameState);
        }
        else gameState.velBallX *= -1;
    }
    checkCollision(client, gameState);
    gameState.posBallX = posX;
    //console.log(gameState.posBallX +" " + gameState.posBallY)
}
function checkCollision(client: Client, gameState: PongState) {
    if(gameState.posBallX <= 20 && gameState.posBallX >= 0 && gameState.velBallX < 0) {
        //console.log("at the threshhold, left side");
        if(gameState.posPlayerA <= gameState.posBallY && gameState.posPlayerA + gameState.sizes.at(1) >= gameState.posBallY) {
            //console.log("hit bat");
            calcNewAngle(gameState.posPlayerA, gameState)
        }
        
    }
    if(gameState.posBallX <= 1280 && gameState.posBallX >= 1260 && gameState.velBallX > 0) {
        //console.log("at the threshhold, right side");
        if(gameState.posPlayerB <= gameState.posBallY && gameState.posPlayerB + gameState.sizes.at(1) >= gameState.posBallY) {
            //console.log("hit bat");
            calcNewAngle(gameState.posPlayerB, gameState)
        }
    }
}
function calcNewAngle(playerPos: number, gameState: PongState) {
    const sectionLength = gameState.sizes.at(1)/ batSections.length;
    for(let i = 0; i < batSections.length; i++) {
        if (gameState.posBallY  <= playerPos + sectionLength * (i+1)) {
            //console.log(batSections[i] + " " + i);
            gameState.velBallY = gameState.velBallY + batSections[i];
            if(Math.abs(gameState.velBallY)>= 0.8) {
                gameState.velBallY > 0? gameState.velBallY = 0.8: gameState.velBallY = -0.8;
            }
            if (gameState.velBallX < 0){ //nahc rechts
                gameState.velBallX = 1 - Math.abs(gameState.velBallY);
            }
            else {
                gameState.velBallX = -(1-Math.abs(gameState.velBallY));
            }           
            return;
        }
    }
}
function startNewRound(game:PongState){
    game.posBallX = 640-(game.sizes.at(0)/2);
    game.posBallY = 320-(game.sizes.at(0)/2);
    game.velBallX = Math.random();
    if(game.velBallX < 0.2) {
        game.velBallX = 0.2;
    }
    game.velBallY = 1 - Math.abs(game.velBallX);
    hasScored = false;
}
function startNextRound(game:PongState){
    game.posBallX = 444;
    game.posBallY = 1100;
    setTimeout(() => startNewRound(game), 1000);
}

