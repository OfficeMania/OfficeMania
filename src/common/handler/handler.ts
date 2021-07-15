import {Client} from "colyseus";

export interface Handler {

    init(options: any);

    onJoin(client: Client);

    onLeave(client: Client, consented: boolean);

    onDispose();

}
