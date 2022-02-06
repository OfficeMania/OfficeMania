import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateConfigEntry1644161703436 implements MigrationInterface {
    name = 'CreateConfigEntry1644161703436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "config" (
                "key" character varying(64) NOT NULL,
                "value" character varying(1024),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_26489c99ddbb4c91631ef5cc791" PRIMARY KEY ("key")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "config"
        `);
    }

}
