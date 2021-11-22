import { DataTypes, Model, Sequelize } from "sequelize";
import { createNamespace, Namespace } from "cls-hooked";
import { Transaction } from "sequelize/dist/lib/transaction";
import { DEBUG } from "./config";

const namespace: Namespace = createNamespace("namespace-officemania-sequelize");
Sequelize.useCLS(namespace);

enum SyncMode {
    DEFAULT = "Creating (if not existing)",
    ALTER = "Altering",
    FORCE = "Force syncing",
}

async function syncDatabase(syncMode: SyncMode = SyncMode.DEFAULT): Promise<void> {
    return User.sync({ force: syncMode === SyncMode.FORCE, alter: syncMode === SyncMode.ALTER }).then(value => {
        if (!value) {
            console.error(`Something went wrong when ${syncMode.toString().toLowerCase()} the Database`);
        } else if (DEBUG) {
            console.log(`${syncMode} the Database was successful`);
        }
    });
}

export async function connectDatabase(): Promise<void> {
    return sequelize
        .authenticate()
        .then(() => console.log("Connection to the Database has been established successfully."))
        .then(() => syncDatabase(SyncMode.DEFAULT));
}

export async function disconnectDatabase(): Promise<void> {
    console.log("Disconnecting from the Database");
    return sequelize.close();
}

const sequelize: Sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database_test.sqlite",
});

process.on("exit", disconnectDatabase);

export async function withTransaction<T>(autoCallback: (t: Transaction) => PromiseLike<T>): Promise<T> {
    return sequelize.transaction(autoCallback);
}

export class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "User",
        tableName: "user",
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

async function createTestUser(): Promise<User> {
    return User.create({ username: "Test Username", password: "Test Password 2" });
}

async function createTestUserWithTransaction(): Promise<User> {
    return withTransaction(createTestUser);
}

export async function testDatabase(): Promise<void> {
    console.debug("Testing the Database...");
    return syncDatabase(SyncMode.FORCE)
        .then(() => createTestUserWithTransaction())
        .then(value => value["dataValues"])
        .then(console.log);
}
