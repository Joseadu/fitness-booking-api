import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNotifications1738421000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create notifications table
        await queryRunner.createTable(
            new Table({
                name: 'notifications',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'NOW()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'NOW()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'data',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'channels',
                        type: 'varchar',
                        isArray: true,
                        default: "ARRAY['in_app']",
                    },
                    {
                        name: 'priority',
                        type: 'varchar',
                        length: '20',
                        default: "'normal'",
                    },
                    {
                        name: 'read_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'delivered_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'delivery_status',
                        type: 'varchar',
                        length: '20',
                        default: "'pending'",
                    },
                    {
                        name: 'action_url',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'action_label',
                        type: 'varchar',
                        length: '100',
                        isNullable: true,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'profiles',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'idx_notifications_user',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'idx_notifications_status',
                columnNames: ['delivery_status'],
            }),
        );

        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'idx_notifications_type',
                columnNames: ['type'],
            }),
        );

        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'idx_notifications_read',
                columnNames: ['user_id', 'read_at'],
            }),
        );

        // Create notification_preferences table
        await queryRunner.createTable(
            new Table({
                name: 'notification_preferences',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'email_enabled',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'push_enabled',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'in_app_enabled',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'preferences',
                        type: 'jsonb',
                        default: `'{
                            "waitlist_available": {"email": true, "push": true, "in_app": true},
                            "booking_confirmed": {"email": true, "push": false, "in_app": true},
                            "class_cancelled": {"email": true, "push": true, "in_app": true},
                            "reminder_24h": {"email": true, "push": true, "in_app": false}
                        }'`,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'profiles',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'notification_preferences',
            new TableIndex({
                name: 'idx_notification_preferences_user_unique',
                columnNames: ['user_id'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('notification_preferences');
        await queryRunner.dropTable('notifications');
    }
}
