import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";
import { RequestHandler } from "express-serve-static-core";
import { hashSync } from "bcrypt";
import { BCRYPT_SALT_ROUNDS, PASSWORD_SECRET } from "../../config";
import CryptoJS from "crypto-js";

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
    @PrimaryColumn({ type: "uuid" })
    id: string;

    @Column({ type: "varchar", length: 255, unique: true })
    username: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    password: string;

    @Column({ name: "password_version", type: "int", nullable: true })
    passwordVersion: number;

    @Column({ name: "created_at", type: "datetime", default: "now()" })
    createdAt: Date;

    @Column({ type: "int", default: 0 })
    role: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    character: string;

    @Column({ name: "display_name", type: "varchar", length: 255, nullable: true })
    displayName: string;
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
            res.sendStatus(401);
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
