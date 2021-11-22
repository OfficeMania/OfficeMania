import { Model, Sequelize } from "sequelize";
import { createNamespace, Namespace } from "cls-hooked";
import { Transaction } from "sequelize/dist/lib/transaction";
import { DEBUG } from "./config";
import User from "./user";

const namespace: Namespace = createNamespace("namespace-officemania-sequelize");
Sequelize.useCLS(namespace);

enum SyncMode {
    DEFAULT = "Creating (if not existing)",
    ALTER = "Altering",
    FORCE = "Force syncing",
}

async function authenticateDatabase(): Promise<void> {
    return sequelize
        .authenticate()
        .then(() => console.log("Connection to the Database has been established successfully"));
}

async function syncDatabase(syncMode: SyncMode = SyncMode.DEFAULT): Promise<void> {
    return User.sync({ force: syncMode === SyncMode.FORCE, alter: syncMode === SyncMode.ALTER }).then(value => {
        if (!value) {
            console.error(`Something went wrong when ${syncMode.toString().toLowerCase()} the Database`);
        } else if (DEBUG) {
            console.debug(`${syncMode} the Database was successful`);
        }
    });
}

export async function connectDatabase(syncMode: SyncMode = SyncMode.DEFAULT): Promise<void> {
    return authenticateDatabase().then(() => syncDatabase(syncMode));
}

export async function disconnectDatabase(): Promise<void> {
    console.log("Disconnecting from the Database");
    return sequelize.close();
}

export const sequelize: Sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite",
});

process.on("exit", disconnectDatabase);

export async function withTransaction<T>(autoCallback: (t: Transaction) => PromiseLike<T>): Promise<T> {
    return sequelize.transaction(autoCallback);
}

export function getEntity<T>(array: [T, boolean]): T {
    return array[0];
}

export function getId(entity: Model): string {
    return entity["id"];
}
