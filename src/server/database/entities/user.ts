import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

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
