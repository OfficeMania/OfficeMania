import {MigrationInterface, QueryRunner} from "typeorm";

export class AddConfigEntryType1644177814019 implements MigrationInterface {
    name = 'AddConfigEntryType1644177814019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."config_type_enum" AS ENUM('0', '1', '2', '3')
        `);
        await queryRunner.query(`
            ALTER TABLE "config"
            ADD "type" "public"."config_type_enum" NOT NULL DEFAULT '0'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "config" DROP COLUMN "type"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."config_type_enum"
        `);
    }

}
