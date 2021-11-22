import { DataTypes, Model } from "sequelize";
import { getEntity, sequelize } from "./database";
import { compare, compareSync } from "bcrypt";

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

export function createUser(username: string, password: string = undefined): Promise<User> {
    return User.create({ username, password });
}

export function findOrCreateUserByUsername(username: string, password: string = undefined): Promise<User> {
    return User.findOrCreate({ where: { username }, defaults: { password } }).then(getEntity);
}

function createOfficeManiaUser(): Promise<User> {
    return createUser("officemania", "$2b$12$.eGqcfCBgcGfTAcz37bn.e0v9c1jgmxeAeIYld/K7XbOVx6f8158.");
}

function createTestUser(): Promise<User> {
    return createUser("Test Username", "Invalid Bcrypt Password Hash");
}
