import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "invite_code" })
export class InviteCode extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number;

    @Column({ type: "varchar", length: 32 })
    code: string;

    @Column({ type: "int", default: 0 })
    usages: number;

    @Column({ name: "usages_left", type: "int", default: -1 })
    usagesLeft: number;

    @Column({ nullable: true })
    expiration?: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
