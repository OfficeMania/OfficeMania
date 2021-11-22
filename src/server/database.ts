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

async function initDatabase(): Promise<void> {
    return withTransaction(() => Promise.all([createOfficeManiaUser(), createTestUser()])).then(users => {
        if (!users || users.length !== 2) {
            console.error("Something went wrong when creating the default users");
        } else if (DEBUG) {
            console.debug("Default users were created successfully");
        }
    });
}

export async function connectDatabase(syncMode: SyncMode = SyncMode.DEFAULT): Promise<void> {
    return authenticateDatabase()
        .then(() => syncDatabase(syncMode))
        .then(() => initDatabase());
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

async function createOfficeManiaUser(): Promise<[User, boolean]> {
    return User.findOrCreate({
        where: { username: "officemania" },
        defaults: {
            password: "$2b$12$.eGqcfCBgcGfTAcz37bn.e0v9c1jgmxeAeIYld/K7XbOVx6f8158.",
        },
    });
}

async function createTestUser(): Promise<[User, boolean]> {
    return User.findOrCreate({
        where: { username: "Test Username" },
        defaults: { password: "Invalid Bcrypt Password" },
    });
}
