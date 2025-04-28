import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/bookings/entities/order.entity';
import { EventDailyStatistics, EventStatistics } from './entities/event-statistics.entity';

@Injectable()
export class EventStatisticsService {
  private readonly logger = new Logger(EventStatisticsService.name);

  constructor(
  ) { }

  /**
   * Updates aggregate and daily stats within a shared transaction.
   */
  async updateStatistics(order: Order, manager: EntityManager): Promise<void> {
    await this.updateAggregateStats(order, manager);
    await this.updateDailyStats(order, manager);
  }

  private async updateAggregateStats(order: Order, manager: EntityManager) {
    const repo = manager.getRepository(EventStatistics);
    let stats = await repo.findOne({ where: { eventId: order.eventId } });
    const ticketsSold = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (!stats) {
      // create new stats row
      await repo.save(
        repo.create({
          eventId: order.eventId,
          ticketsSold,
          salesTotalGross: order.subtotalAmount,
          salesTotalNet: order.totalAmount,
          totalDiscount: order.platformDiscountAmount,
          ordersCreated: 1,
        }),
      );
      this.logger.debug(`Created base stats for event ${order.eventId}`);
      return;
    }
    const oldVersion = stats.version;
    const result = await repo
      .createQueryBuilder()
      .update(EventStatistics)
      .set({
        ticketsSold: () => `"tickets_sold" + ${ticketsSold}`,
        salesTotalGross: () => `"sales_total_gross" + ${order.subtotalAmount}`,
        salesTotalNet: () => `"sales_total_net" + ${order.totalAmount}`,
        totalDiscount: () => `"total_discount" + ${order.platformDiscountAmount}`,
        ordersCreated: () => `"orders_created" + 1`,
        version: () => `"version" + 1`,
      })
      .where('event_id = :eventId AND version = :oldVersion', { eventId: order.eventId, oldVersion })
      .execute();

    if (result.affected === 0) {
      throw new Error(`Event statistics version mismatch for event ${order.eventId}`);
    }
    this.logger.debug(`Updated aggregate stats for event ${order.eventId}`);
  }

  private async updateDailyStats(order: Order, manager: EntityManager) {
    const date = order.paidAt;
    const repo = manager.getRepository(EventDailyStatistics);
    let stats = await repo.findOne({ where: { eventId: order.eventId, date } });
    const ticketsSold = order.items.reduce((sum, i) => sum + i.quantity, 0);
    if (!stats) {
      // create new daily stats row
      await repo.save(
        repo.create({
          eventId: order.eventId,
          date,
          ticketsSold,
          salesTotalGross: order.subtotalAmount,
          salesTotalNet: order.totalAmount,
          totalDiscount: order.platformDiscountAmount,
          ordersCreated: 1,
        }),
      );
      this.logger.debug(`Created daily stats for event ${order.eventId} on ${date}`);
      return;
    }
    const oldVersion = stats.version;
    const result = await repo
      .createQueryBuilder()
      .update(EventDailyStatistics)
      .set({
        ticketsSold: () => `"tickets_sold" + ${ticketsSold}`,
        salesTotalGross: () => `"sales_total_gross" + ${order.subtotalAmount}`,
        salesTotalNet: () => `"sales_total_net" + ${order.totalAmount}`,
        totalDiscount: () => `"total_discount" + ${order.platformDiscountAmount}`,
        ordersCreated: () => `"orders_created" + 1`,
        version: () => `"version" + 1`,
      })
      .where(
        'event_id = :eventId AND date = :date AND version = :oldVersion',
        { eventId: order.eventId, date, oldVersion },
      )
      .execute();

    if (result.affected === 0) {
      throw new Error(
        `Event daily statistics version mismatch for ${order.eventId} on ${date}`,
      );
    }
    this.logger.debug(
      `Updated daily stats for event ${order.eventId} on ${date}`,
    );
  }
}
