import { DataTypes, Model } from "sequelize";
import { getEntity, sequelize } from "./database";
import { compareSync, hashSync } from "bcrypt";
import { BCRYPT_SALT_ROUNDS, PASSWORD_SECRET } from "./config";
import CryptoJS from "crypto-js";

enum PasswordVersion {
    NONE,
    PLAIN,
    BCRYPT,
    ENCRYPTED_BCRYPT,
}

export default class User extends Model {
    private getPassword(): string {
        return this["password"];
    }

    private decryptPassword(): string {
        return CryptoJS.AES.decrypt(this.getPassword(), PASSWORD_SECRET).toString(CryptoJS.enc.Utf8);
    }

    public compareSync(password: string): boolean {
        return compareSync(password, this.decryptPassword());
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

function encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, PASSWORD_SECRET).toString();
}

export function createUser(username: string, password: string = undefined): Promise<User> {
    return User.create({ username, password: encryptPassword(hashPasswordSync(password)) });
}

export function findOrCreateUserByUsername(username: string, password: string = undefined): Promise<User> {
    return User.findOrCreate({
        where: { username },
        defaults: { password: encryptPassword(hashPasswordSync(password)) },
    }).then(getEntity);
}
