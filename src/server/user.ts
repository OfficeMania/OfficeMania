import { DataTypes, Model } from "sequelize";
import { getEntity, sequelize } from "./database";
import { compare, compareSync, hash, hashSync } from "bcrypt";
import { SALT_ROUNDS } from "./config";

export default class User extends Model {
    getId(): string {
        return this["id"];
    }

    getUsername(): string {
        return this["username"];
    }

    private getPassword(): string {
        return this["password"];
    }

    compareSync(password: string): boolean {
        return compareSync(password, this.getPassword());
    }

    compare(password: string): Promise<boolean> {
        return compare(password, this.getPassword());
    }
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
    return hashSync(password, SALT_ROUNDS);
}

function hashPassword(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS);
}

export function createUser(username: string, password: string = undefined): Promise<User> {
    return User.create({ username, password: hashPassword(password) });
}

export function findOrCreateUserByUsername(username: string, password: string = undefined): Promise<User> {
    return User.findOrCreate({ where: { username }, defaults: { password: hashPassword(password) } }).then(getEntity);
}

function createOfficeManiaUser(): Promise<User> {
    return createUser("officemania", "sec-sep21-project");
}

function createTestUser(): Promise<User> {
    return createUser("Test Username", "gezrougfnbvc4wgvriugwiuerocvfzrqfziugwzufur");
}
