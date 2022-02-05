import { Connection, createConnection, DeepPartial, EntityManager, EntityTarget, getConnection } from "typeorm";
import { ConnectionOptions } from "typeorm/connection/ConnectionOptions";
import { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { InviteCode } from "./entities/invite-code";
import { User } from "./entities/user";
import { DB, DB_DATABASE, DB_FILE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USERNAME } from "../config";
import { EntitySchema } from "typeorm/entity-schema/EntitySchema";

const entities: (Function | string | EntitySchema)[] = [InviteCode, User];

function createSqliteConnectionOptions(synchronize: boolean): SqliteConnectionOptions {
    return {
        type: "sqlite",
        entities,
        synchronize,
        database: DB_FILE || "database.sqlite",
    };
}

function createPostgresConnectionOptions(synchronize: boolean): PostgresConnectionOptions {
    return {
        type: "postgres",
        entities,
        synchronize,
        host: DB_HOST || "localhost",
        port: DB_PORT || 5432,
        username: DB_USERNAME || "officemania",
        password: DB_PASSWORD,
        database: DB_DATABASE || "officemania",
    };
}

export async function connectDatabase(synchronize = false): Promise<Connection> {
    let connectionOptions: ConnectionOptions;
    switch (DB.toLowerCase()) {
        case "sqlite":
        case "sqlite3":
            connectionOptions = createSqliteConnectionOptions(synchronize);
            break;
        case "postgres":
        case "postgresql":
            connectionOptions = createPostgresConnectionOptions(synchronize);
            break;
        default:
            throw new Error(`Unsupported Database "${DB}"`);
    }
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

export async function createOrUpdate<Entity>(
    entityManager: EntityManager,
    entityClass: EntityTarget<Entity>,
    entityLike: DeepPartial<Entity>,
    preloadProcessor?: (created: Entity, preloaded?: Entity) => Entity | undefined
): Promise<Entity> {
    const createdEntity: Entity = entityManager.create(entityClass, entityLike);
    const preloadedEntity: Entity | undefined = await entityManager
        .preload(entityClass, createdEntity)
        .then((value: Entity | undefined) => {
            if (preloadProcessor) {
                return preloadProcessor(createdEntity, value);
            }
            return value;
        });
    const savedEntity: Entity = await entityManager.save(preloadedEntity || createdEntity);
    if (!savedEntity) {
        throw new Error(`Could not save ${entityClass}`);
    }
    return savedEntity;
}

export async function createOrUpdateMultiple<Entity>(
    entityManager: EntityManager,
    entityClass: EntityTarget<Entity>,
    entityLikes: DeepPartial<Entity>[]
): Promise<Entity[]> {
    const createdEntities: Entity[] = entityManager.create(entityClass, entityLikes);
    const savedEntities: Entity[] = [];
    for (const createdEntity of createdEntities) {
        const preloadedEntity: Entity | undefined = await entityManager.preload(entityClass, createdEntity);
        const savedEntity: Entity = await entityManager.save(preloadedEntity || createdEntity);
        if (!savedEntity) {
            throw new Error(`Could not save ${entityClass}`);
        }
        savedEntities.push(savedEntity);
    }
    return savedEntities;
}
