import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUserActive1644359074595 implements MigrationInterface {
    name = 'AddUserActive1644359074595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "active" boolean NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "active"
        `);
    }

}
