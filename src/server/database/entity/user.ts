import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { compareSync, hashSync } from "bcrypt";
import { BCRYPT_SALT_ROUNDS, PASSWORD_SECRET } from "../../config";
import CryptoJS from "crypto-js";
import { RequestHandler } from "express";

export enum PasswordVersion {
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

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255, unique: true })
    username: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    password: string;

    @Column({ name: "password_version", type: "int", nullable: true })
    passwordVersion: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @Column({ type: "int", default: 0 })
    role: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    character: string;

    @Column({ name: "display_name", type: "varchar", length: 255, nullable: true })
    displayName: string;

    public checkPassword(password: string): boolean {
        if (!this.passwordVersion) {
            return false;
        }
        switch (this.passwordVersion) {
            case PasswordVersion.NONE:
                return true;
            case PasswordVersion.PLAIN:
                return password === this.password;
            case PasswordVersion.BCRYPT:
            case PasswordVersion.ENCRYPTED_BCRYPT:
                let passwordHash: string = this.password;
                if (this.passwordVersion === PasswordVersion.ENCRYPTED_BCRYPT) {
                    passwordHash = CryptoJS.AES.decrypt(passwordHash, PASSWORD_SECRET).toString(CryptoJS.enc.Utf8);
                }
                return compareSync(password, passwordHash);
            default:
                throw new Error(`Unsupported Password Version: ${this.passwordVersion}`);
        }
    }

    private upgradePasswordOnce(): boolean {
        const password: string = this.password;
        const version: PasswordVersion = this.passwordVersion;
        const nextVersion: PasswordVersion = version + 1;
        switch (version) {
            case PasswordVersion.NONE:
                return false;
            case PasswordVersion.PLAIN:
            case PasswordVersion.BCRYPT:
                this.password = serializePassword(password, nextVersion);
                this.passwordVersion = nextVersion;
                return true;
            case PasswordVersion.ENCRYPTED_BCRYPT:
                return false;
            default:
                throw new Error(`Unsupported Password Version: ${version}`);
        }
    }

    public upgradePassword(version: PasswordVersion): boolean {
        if (this.passwordVersion > version) {
            throw new Error("Cannot downgrade Password");
        }
        while (this.passwordVersion < version) {
            if (!this.upgradePasswordOnce()) {
                return false;
            }
        }
        return true;
    }
}

export function ensureHasRole(...roles): RequestHandler {
    return (req, res, next) => {
        const user: User = req.user as User;
        if (!user) {
            return res.redirect("/auth/login");
        }
        const userRole: Role = user.role;
        const hasRole: boolean = roles.find(role => userRole === role);
        if (!hasRole) {
            return res.sendStatus(401);
        }
        return next();
    };
}

function encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, PASSWORD_SECRET).toString();
}

export function serializePassword(password: string, version: PasswordVersion): string {
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

export function createUser(
    username: string,
    password: string = undefined,
    passwordVersion: PasswordVersion = PasswordVersion.LATEST
): Promise<User> {
    return User.create({ username, password: serializePassword(password, passwordVersion), passwordVersion }).save();
}

export async function findOrCreateUserByUsername(
    username: string,
    password: string = undefined,
    passwordVersion: PasswordVersion = PasswordVersion.LATEST
): Promise<User> {
    const user: User | undefined = await User.findOne({ where: { username } });
    if (user) {
        return user;
    }
    return User.create({
        username,
        password: serializePassword(password, passwordVersion),
        passwordVersion,
    }).save();
}
