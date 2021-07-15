import {Direction, MessageType} from "../util";
import {PongState} from "../rooms/schema/state";
import {Client} from "colyseus";
import {Handler} from "./handler";

export enum PongMessage {
    ON_INTERACTION = "pong",
    INIT = "pong-init",
    UPDATE = "pong-update",
    LEAVE = "pong-leave",
    END = "pong-end"
}

export class PongHandler implements Handler {

    init(options: any) {
        //TODO
    }

    onJoin(client: Client) {
        //TODO
    }

    onLeave(client: Client, consented: boolean) {
        //TODO
    }

    onDispose() {
        //Nothing
    }

}


export function registerPongHandler() {
    this.onMessage(MessageType.MOVE_PONG, (client, message) => onPongMove.call(this, client, message));
}

function onPongMove(client, message) {
    const gameState: PongState = this.state.pongStates[this.getPongGame(client).toString()]
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
