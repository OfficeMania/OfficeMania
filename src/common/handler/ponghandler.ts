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

export class PongHandler implements Handler {

    room: Room<State>;

    init(room: Room<State>) {
        this.room = room;
    }

    onCreate(options: any) {
        this.room.onMessage(MessageType.PONG_INTERACTION, (client, message) => onPongInteraction(this.room, client, message));
        this.room.onMessage(MessageType.PONG_MOVE, (client, message) => onPongMove(this.room, client, message));
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
                            emptyState.posPlayerB = 500 - (emptyState.sizes.at(1) / 2)
                        }
                        if (!emptyState.playerB) {
                            emptyState.playerB = client.sessionId;
                            emptyState.posPlayerB = 500 - (emptyState.sizes.at(1) / 2)
                        }
                    }
                } else {
                    console.log("creating new pongstate");
                    console.log(getNextPongSlot(room));
                    let ar = getNextPongSlot(room);
                    let newState = new PongState();
                    newState.playerA = client.sessionId;
                    newState.velocities.push(10, 10);
                    newState.sizes.push(10, 100)
                    newState.posPlayerA = 500 - (newState.sizes.at(1) / 2);

                    room.state.pongStates[ar.toString()] = newState;
                    console.log(room.state.pongStates[ar.toString()].posPlayerA);
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
            if (pos + gameState.sizes.at(1) < 1000) {
                callback(pos + gameState.velocities.at(1));
            } else {
                callback(1000 - gameState.sizes.at(1));
            }
            break;
        }
    }
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
        console.log(room.state.pongStates[i.toString()].playerA);
        if (!room.state.pongStates[i.toString()].playerA || !room.state.pongStates[i.toString()].playerB) {
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
