import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";
import { RequestHandler } from "express-serve-static-core";

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
