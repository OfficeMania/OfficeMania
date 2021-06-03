import { Room, Client } from "colyseus";
import { State } from "./schema/state";

/*
 * See: https://docs.colyseus.io/server/room/
 */
export class TURoom extends Room<State> {
    onCreate (options: any) {
        let state = new State();
        this.setState(state);
    }

    onAuth(client: Client, options: any, req: any) {
        return true;
    }

    onJoin (client: Client) {
        this.state.players[client.sessionId] = client.sessionId;
    }

    onLeave (client: Client, consented: boolean) {
        delete this.state.players[client.sessionId];
    }

    onDispose () { }
}