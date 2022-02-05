import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1644101842406 implements MigrationInterface {
    name = 'Init1644101842406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "invite_code" (
                "id" SERIAL NOT NULL,
                "code" character varying(32) NOT NULL,
                "usages" integer NOT NULL DEFAULT '0',
                "usages_left" integer NOT NULL DEFAULT '-1',
                CONSTRAINT "PK_a8940979efb1a84ca3470a09c85" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying(255) NOT NULL,
                "password" character varying(255),
                "password_version" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "role" integer NOT NULL DEFAULT '0',
                "character" character varying(255),
                "display_name" character varying(255),
                CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "user"
        `);
        await queryRunner.query(`
            DROP TABLE "invite_code"
        `);
    }

}
