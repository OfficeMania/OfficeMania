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
    LATEST = ENCRYPTED_BCRYPT,
}

export default class User extends Model {
    private getPassword(): string {
        return this["password"];
    }

    private setPassword(password: string): void {
        this["password"] = password;
    }

    private getPasswordVersion(): PasswordVersion {
        return this["passwordVersion"];
    }

    private setPasswordVersion(version: PasswordVersion): void {
        this["passwordVersion"] = version;
    }

    public checkPassword(password: string): boolean {
        const version: PasswordVersion = this.getPasswordVersion();
        switch (version) {
            case PasswordVersion.NONE:
                return true;
            case PasswordVersion.PLAIN:
                return password === this.getPassword();
            case PasswordVersion.BCRYPT:
            case PasswordVersion.ENCRYPTED_BCRYPT:
                let passwordHash: string = this.getPassword();
                if (version === PasswordVersion.ENCRYPTED_BCRYPT) {
                    passwordHash = CryptoJS.AES.decrypt(passwordHash, PASSWORD_SECRET).toString(CryptoJS.enc.Utf8);
                }
                return compareSync(password, passwordHash);
            default:
                throw new Error(`Unsupported Password Version: ${version}`);
        }
    }

    private upgradePasswordOnce(): boolean {
        const password: string = this.getPassword();
        const version: PasswordVersion = this.getPasswordVersion();
        switch (version) {
            case PasswordVersion.NONE:
                return false;
            case PasswordVersion.PLAIN:
                this.setPassword(hashPasswordSync(password));
                this.setPasswordVersion(PasswordVersion.BCRYPT);
                return true;
            case PasswordVersion.BCRYPT:
                this.setPassword(encryptPassword(password));
                this.setPasswordVersion(PasswordVersion.ENCRYPTED_BCRYPT);
                return true;
            case PasswordVersion.ENCRYPTED_BCRYPT:
                return false;
            default:
                throw new Error(`Unsupported Password Version: ${version}`);
        }
    }

    public upgradePassword(version: PasswordVersion): boolean {
        if (this.getPasswordVersion() > version) {
            throw new Error("Cannot downgrade Password");
        }
        while (this.getPasswordVersion() < version) {
            if (!this.upgradePasswordOnce()) {
                return false;
            }
        }
        return true;
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
        passwordVersion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "password_version",
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

export function createUser(
    username: string,
    password: string = undefined,
    passwordVersion: PasswordVersion = PasswordVersion.LATEST
): Promise<User> {
    return User.create({ username, password: serializePassword(password, passwordVersion), passwordVersion });
}

export function findOrCreateUserByUsername(
    username: string,
    password: string = undefined,
    passwordVersion: PasswordVersion = PasswordVersion.LATEST
): Promise<User> {
    return User.findOrCreate({
        where: { username },
        defaults: { password: serializePassword(password, passwordVersion), passwordVersion },
    }).then(getEntity);
}

function serializePassword(password: string, version: PasswordVersion): string {
    switch (version) {
        case PasswordVersion.NONE:
            return;
        case PasswordVersion.PLAIN:
            return password;
        case PasswordVersion.BCRYPT:
        case PasswordVersion.ENCRYPTED_BCRYPT:
            const passwordHash: string = hashPasswordSync(password);
            if (version === PasswordVersion.BCRYPT) {
                return passwordHash;
            }
            return encryptPassword(passwordHash);
        default:
            throw new Error(`Unsupported Password Version: ${version}`);
    }
}
