import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';

@Entity('event_statistics')
export class EventStatistics {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'event_id' })
    eventId: number;

    @Column({ name: 'unique_views', type: 'bigint', default: 0 })
    uniqueViews: number;

    @Column({ name: 'total_views', type: 'bigint', default: 0 })
    totalViews: number;

    @Column({ name: 'sales_total_gross', type: 'decimal', precision: 14, scale: 2, default: 0 })
    salesTotalGross: number;

    @Column({ name: 'sales_total_net', type: 'decimal', precision: 14, scale: 2, default: 0 })
    salesTotalNet: number;

    @Column({ name: 'tickets_sold', type: 'integer', default: 0 })
    ticketsSold: number;

    @Column({ name: 'orders_created', type: 'integer', default: 0 })
    ordersCreated: number;

    @Column({ name: 'total_discount', type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalDiscount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    @VersionColumn({ name: 'version' })
    version: number;
}

@Entity('event_daily_statistics')
export class EventDailyStatistics {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'event_id' })
    eventId: number;

    @Column({ name: "date" })
    date: Date;

    @Column({ name: 'total_views', type: 'bigint', default: 0 })
    totalViews: number;

    @Column({ name: 'sales_total_gross', type: 'decimal', precision: 14, scale: 2, default: 0 })
    salesTotalGross: number;

    @Column({ name: 'sales_total_net', type: 'decimal', precision: 14, scale: 2, default: 0 })
    salesTotalNet: number;

    @Column({ name: 'tickets_sold', type: 'integer', default: 0 })
    ticketsSold: number;

    @Column({ name: 'orders_created', type: 'integer', default: 0 })
    ordersCreated: number;

    @Column({ name: 'total_discount', type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalDiscount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    @VersionColumn({ name: 'version' })
    version: number;
}