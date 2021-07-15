import {Client, Room} from "colyseus";
import {State} from "../rooms/schema/state";

export interface Handler {

    init(room: Room<State>);

    onCreate(options: any);

    onJoin(client: Client);

    onLeave(client: Client, consented: boolean);

    onDispose();

}
