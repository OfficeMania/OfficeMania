import {MigrationInterface, QueryRunner} from "typeorm";

export class InviteCodeMetadata1644101941748 implements MigrationInterface {
    name = 'InviteCodeMetadata1644101941748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invite_code"
            ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "invite_code"
            ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invite_code" DROP COLUMN "updated_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "invite_code" DROP COLUMN "created_at"
        `);
    }

}
