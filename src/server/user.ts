import { DataTypes, Model } from "sequelize";
import { getEntity, sequelize } from "./database";
import { compareSync, hashSync } from "bcrypt";
import { BCRYPT_SALT_ROUNDS } from "./config";

export default class User extends Model {
    private getPassword(): string {
        return this["password"];
    }

    public compareSync(password: string): boolean {
        return compareSync(password, this.getPassword());
    }
}

export function getUsername(user: User): string {
    return user["username"];
}

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
            allowNull: true,
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

export function findUserById(id: string): Promise<User> {
    return User.findByPk(id);
}

export function findUserByUsername(username: string): Promise<User> {
    return User.findOne({ where: { username } });
}

function hashPasswordSync(password: string): string {
    return hashSync(password, BCRYPT_SALT_ROUNDS);
}

export function createUser(username: string, password: string = undefined): Promise<User> {
    return User.create({ username, password: hashPasswordSync(password) });
}

export function findOrCreateUserByUsername(username: string, password: string = undefined): Promise<User> {
    return User.findOrCreate({ where: { username }, defaults: { password: hashPasswordSync(password) } }).then(
        getEntity
    );
}
