import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  VoucherCodeType,
  VoucherDiscountType,
  VoucherStatus,
} from './voucher.constant';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: VoucherCodeType,
    default: VoucherCodeType.SINGLE,
    name: 'code_type',
  })
  codeType: VoucherCodeType;

  @Column({ default: '', name: 'bulk_code_prefix' })
  bulkCodePrefix: string;

  @Column({ default: 0, name: 'bulk_code_number' })
  bulkCodeNumber: number;

  @Column({
    type: 'enum',
    enum: VoucherDiscountType,
    default: VoucherDiscountType.FIXED,
    name: 'discount_type',
  })
  discountType: VoucherDiscountType;

  @Column('decimal', { precision: 10, scale: 2, name: 'discount_value' })
  discountValue: number;

  @Column()
  quantity: number;

  @Column({ default: false, name: 'is_unlimited' })
  isUnlimited: boolean;

  @Column({ default: 0, name: 'max_order_per_user' })
  maxOrderPerUser: number;

  @Column({ default: 0, name: 'min_qty_per_order' })
  minQtyPerOrder: number;

  @Column({ default: 0, name: 'max_qty_per_order' })
  maxQtyPerOrder: number;

  @Column({ default: '', name: 'discount_code' })
  discountCode: string;

  @Column('jsonb', { nullable: true, name: 'showing_configs' })
  showingConfigs: {
    id: number;
    isAllTicketTypes: boolean;
    ticketTypeIds: number[];
  }[];
  @Column({ name: 'is_all_showings' })
  isAllShowings: boolean;

  @Column({
    type: 'enum',
    enum: VoucherStatus,
    default: VoucherStatus.ACTIVE,
    name: 'status',
  })
  status: VoucherStatus;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time' })
  endTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
