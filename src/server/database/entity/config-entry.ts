import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "config" })
export class ConfigEntry extends BaseEntity {
    @PrimaryColumn({ type: "varchar", length: 64 })
    key: string;

    @Column({ type: "varchar", length: 1024, nullable: true })
    value: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
