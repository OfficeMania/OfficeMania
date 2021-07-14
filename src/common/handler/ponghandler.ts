import {Direction, MessageType} from "../util";
import {PongState} from "../rooms/schema/state";

export function onPongMessage() {
    this.onMessage(MessageType.MOVE_PONG, (client, message) => {
        //console.log("move_pong recieved" + message);
        const gameState: PongState = this.state.pongStates[this.getPongGame(client).toString()]
        //console.log(gameState);
        if (gameState && gameState.playerIds.at(0) === client.sessionId) {
            switch (message) {
                case Direction.UP: {
                    if (gameState.posPlayerA > 0) {
                        gameState.posPlayerA -= gameState.velocities.at(1);
                    } else {
                        gameState.posPlayerA = 0;
                    }
                    break;
                }
                case Direction.DOWN: {
                    if (gameState.posPlayerA + gameState.sizes.at(1) < 1000) {
                        gameState.posPlayerA += gameState.velocities.at(1);
                    } else {
                        gameState.posPlayerA = 1000 - gameState.sizes.at(1);
                    }
                    break;
                }
            }
            //console.log(gameState.posPlayerA + " is pos of player a");
        } else if (gameState && gameState.playerIds.at(1) === client.sessionId) {
            switch (message) {
                case Direction.UP: {
                    if (gameState.posPlayerB > 0) {
                        gameState.posPlayerB -= gameState.velocities.at(1);
                    } else {
                        gameState.posPlayerB = 0;
                    }
                    break;
                }
                case Direction.DOWN: {
                    if (gameState.posPlayerB + gameState.sizes.at(1) < 1000) {
                        gameState.posPlayerB += gameState.velocities.at(1);
                    } else {
                        gameState.posPlayerB = 1000 - gameState.sizes.at(1);
                    }
                    break;
                }
            }
            //console.log(gameState.posPlayerB + " is pos of player B");
        }
    })
}
