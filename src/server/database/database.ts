import { Connection, createConnection, DeepPartial, EntityManager, EntityTarget, getConnection } from "typeorm";
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
