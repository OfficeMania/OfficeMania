import { DataTypes, Model } from "sequelize";
import { getEntity, sequelize } from "../database";
import { compareSync, hashSync } from "bcrypt";
import CryptoJS from "crypto-js";
import { RequestHandler } from "express-serve-static-core";
import { BCRYPT_SALT_ROUNDS, PASSWORD_SECRET } from "../../config";

enum PasswordVersion {
    NONE,
    PLAIN,
    BCRYPT,
    ENCRYPTED_BCRYPT,
    LATEST = ENCRYPTED_BCRYPT,
}

export enum Role {
    USER,
    ADMIN,
}

export default class User extends Model {
    public getId(): string {
        return this.getDataValue("id");
    }

    public getUsername(): string {
        return this.getDataValue("username");
    }

    public setUsername(username: string): void {
        this.setDataValue("username", username);
    }

    public getDisplayName(): string {
        return this.getDataValue("displayName");
    }

    public setDisplayName(displayName?: string): void {
        this.setDataValue("displayName", displayName);
    }

    public getCharacter(): string | undefined {
        return this.getDataValue("character");
    }

    public setCharacter(character?: string): void {
        this.setDataValue("character", character);
    }

    private getPassword(): string {
        return this.getDataValue("password");
    }

    private setPassword(password: string): void {
        this.setDataValue("password", password);
    }

    private getPasswordVersion(): PasswordVersion {
        return this.getDataValue("passwordVersion");
    }

    private setPasswordVersion(passwordVersion: PasswordVersion): void {
        this.setDataValue("passwordVersion", passwordVersion);
    }

    public getRole(): Role {
        return this.getDataValue("role");
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
        const nextVersion: PasswordVersion = version + 1;
        switch (version) {
            case PasswordVersion.NONE:
                return false;
            case PasswordVersion.PLAIN:
            case PasswordVersion.BCRYPT:
                this.setPassword(serializePassword(password, nextVersion));
                this.setPasswordVersion(nextVersion);
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
        displayName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "display_name",
        },
        character: {
            type: DataTypes.STRING,
            allowNull: true,
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
        role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
            const passwordHash: string = hashSync(password, BCRYPT_SALT_ROUNDS);
            if (version === PasswordVersion.BCRYPT) {
                return passwordHash;
            }
            return encryptPassword(passwordHash);
        default:
            throw new Error(`Unsupported Password Version: ${version}`);
    }
}

export function ensureHasRole(...roles): RequestHandler {
    return (req, res, next) => {
        const user: User = req.user as User;
        if (!user) {
            return res.redirect("/auth/login");
        }
        const userRole: Role = user.getRole();
        const hasRole: boolean = roles.find(role => userRole === role);
        if (!hasRole) {
            res.sendStatus(401);
        }
        return next();
    };
}
