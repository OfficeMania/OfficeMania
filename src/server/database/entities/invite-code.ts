import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
