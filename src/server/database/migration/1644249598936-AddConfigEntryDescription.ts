import {MigrationInterface, QueryRunner} from "typeorm";

export class AddConfigEntryDescription1644249598936 implements MigrationInterface {
    name = 'AddConfigEntryDescription1644249598936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "config"
            ADD "description" character varying(1024)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "config" DROP COLUMN "description"
        `);
    }

}
