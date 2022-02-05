import { Connection, createConnection, EntityManager, getConnection } from "typeorm";
import { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";
import { InviteCode } from "./entities/invite-code";
import { User } from "./entities/user";

export async function connectDatabase(synchronize = false): Promise<Connection> {
    const connectionOptions: SqliteConnectionOptions = {
        type: "sqlite",
        database: "database.sqlite",
        entities: [InviteCode, User],
        synchronize,
    };
    return createConnection(connectionOptions);
}

export async function testDatabase(): Promise<void> {
    InviteCode.find()
        .then(inviteCodes => console.debug(inviteCodes))
        .catch(reason => console.error(reason));
    User.find()
        .then(users => console.debug(users))
        .catch(reason => console.error(reason));
}

export async function disconnectDatabase(): Promise<void> {
    console.log("Disconnecting from the Database");
    return getConnection().close();
}

process.on("exit", disconnectDatabase);

export async function withTransaction<T>(autoCallback: (entityManager: EntityManager) => Promise<T>): Promise<T> {
    return getConnection().transaction(autoCallback);
}
