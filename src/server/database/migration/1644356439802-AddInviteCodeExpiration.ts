import {MigrationInterface, QueryRunner} from "typeorm";

export class AddInviteCodeExpiration1644356439802 implements MigrationInterface {
    name = 'AddInviteCodeExpiration1644356439802'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invite_code"
            ADD "expiration" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invite_code" DROP COLUMN "expiration"
        `);
    }

}
