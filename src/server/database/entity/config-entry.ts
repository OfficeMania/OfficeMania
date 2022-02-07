import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export enum ConfigEntryType {
    STRING,
    NUMBER,
    BOOLEAN,
    DATE,
}

@Entity({ name: "config" })
export class ConfigEntry extends BaseEntity {
    @PrimaryColumn({ type: "varchar", length: 64 })
    key: string;

    @Column({ type: "simple-enum", enum: ConfigEntryType, default: ConfigEntryType.STRING })
    type: ConfigEntryType;

    @Column({ type: "varchar", length: 1024, nullable: true })
    value?: string;

    @Column({ type: "varchar", length: 1024, nullable: true })
    description?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
