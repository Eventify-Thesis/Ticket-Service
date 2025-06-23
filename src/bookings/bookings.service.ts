import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Order, OrderItem, OrderStatus } from "./entities/order.entity";
import { SubmitTicketInfoDto } from "./dto/submit-ticket-info.dto";
import { RedisService } from "../shared/redis/redis.service";
import { TicketType } from "../seat/entities/ticket-type.entity";
import { SeatService } from "../seat/seat.service";
import { MESSAGE } from "./booking.constants";
import { QuestionAnswerDto } from "./dto/question-answer.dto";
import { Voucher } from "./entities/voucher.entity";
import { VoucherStatus } from "./entities/voucher.constant";
import {
  getBookingAnswerKey,
  getBookingCleanupKey,
  getBookingKey,
  getSeatInfoKey,
  getSeatLockKey,
  getSectionLockKey,
  getTicketTypeInfoKey,
  getTicketTypeLockKey,
} from "src/utils/getRedisKey";
import { IdHelper } from "src/common/helper/id-helper";
import { EventStatistics } from "src/payments/entities/event-statistics.entity";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly BOOKING_TTL = 600; // seconds
  private readonly TICKET_TYPE_TTL = 3600; // seconds

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    private readonly redisService: RedisService,
    private readonly seatService: SeatService
  ) {}

  async create(dto: SubmitTicketInfoDto) {
    const bookingCode = uuidv4();
    const now = new Date();
    const reservedUntil = new Date(now.getTime() + this.BOOKING_TTL * 1000);

    // 1. Check & Reserve Ticket Quantity in Redis
    const ticketQuantities: Array<{ ticketTypeId: number; quantity: number }> =
      [];
    const ticketInfoMap = new Map<number, { price: number; name: string }>();

    for (const item of dto.items) {
      const ticketKey = getTicketTypeLockKey(item.id);
      const ticketInfoKey = getTicketTypeInfoKey(item.id);
      let availableQty = parseInt(await this.redisService.get(ticketKey));
      const ticketInfo = await this.redisService.get(ticketInfoKey);
      let ticketPrice: number;
      let ticketName: string;

      if (ticketInfo) {
        const obj = JSON.parse(ticketInfo);
        ticketPrice = obj.price;
        ticketName = obj.name;
      } else {
        const ticketType = await this.ticketTypeRepository.findOne({
          where: { id: item.id },
        });
        if (!ticketType) {
          throw new Error(`Ticket type ${item.id} not found`);
        }
        availableQty = ticketType.quantity - ticketType.soldQuantity;
        ticketPrice = ticketType.price;
        ticketName = ticketType.name;
      }

      const requiredQty = item.quantity;
      if (availableQty < requiredQty) {
        return MESSAGE.TICKET_TYPE_QUANTITY_NOT_ENOUGH;
      }

      // store for cleanup and later item creation
      ticketQuantities.push({ ticketTypeId: item.id, quantity: requiredQty });
      ticketInfoMap.set(item.id, { price: ticketPrice, name: ticketName });

      // decrement and cache back
      availableQty -= requiredQty;
      await this.redisService.set(
        ticketKey,
        availableQty.toString(),
        this.TICKET_TYPE_TTL
      );

      await this.redisService.set(
        ticketInfoKey,
        JSON.stringify({ price: ticketPrice, name: ticketName }),
        this.TICKET_TYPE_TTL
      );
    }

    // 2. Lock Seats in Redis
    for (const item of dto.items) {
      if (item?.seats) {
        for (const seat of item.seats) {
          const seatKey = getSeatLockKey(seat.id.toString());
          if (await this.redisService.get(seatKey)) {
            return MESSAGE.SEAT_ALREADY_BOOKED;
          }
          await this.redisService.set(seatKey, bookingCode, this.BOOKING_TTL);
        }
      }
    }

    // 3. Lock Sections in Redis
    for (const item of dto.items) {
      if (item.sectionId) {
        const sectionKey = getSectionLockKey(item.sectionId.toString());
        const sectionQty = parseInt(await this.redisService.get(sectionKey));
        if (sectionQty < item.quantity) {
          return MESSAGE.SECTION_QUANTITY_NOT_ENOUGH;
        }
        await this.redisService.set(
          sectionKey,
          (sectionQty - item.quantity).toString(),
          this.BOOKING_TTL
        );
      }
    }

    // 4. Persist order + items in a DB transaction
    const { order, items } = await this.dataSource.transaction(
      async (manager) => {
        const orderEntity = manager.create(Order, {
          userId: dto.userId,
          eventId: dto.eventId,
          showId: dto.showId,
          bookingCode,
          status: OrderStatus.PENDING,
          subtotalAmount: 0,
          totalAmount: 0,
          reservedUntil,
          publicId: IdHelper.publicId(IdHelper.ORDER_PREFIX),
          shortId: IdHelper.shortId(IdHelper.ORDER_PREFIX),
        });

        await manager.save(orderEntity);

        await manager.save(EventStatistics, {
          eventId: dto.eventId,
          ordersCreated: 1,
        });

        const orderItems: OrderItem[] = [];
        let subtotal = 0;

        for (const it of dto.items) {
          const info = ticketInfoMap.get(it.id)!;
          const qty = it.seats?.length ? it.seats.length : it.quantity;
          subtotal += info.price * qty;

          if (it.seats?.length) {
            for (const seat of it.seats) {
              const seatInfo = await this.redisService.get(
                getSeatInfoKey(seat.id.toString())
              );

              const obj = JSON.parse(seatInfo!);

              console.log("obj", JSON.stringify(obj, null, 2));

              orderItems.push(
                manager.create(OrderItem, {
                  order_id: orderEntity.id,
                  ticketTypeId: it.id,
                  name: info.name,
                  seatId: seat?.id,
                  rowLabel: obj?.rowLabel,
                  seatNumber: obj?.seatNumber,
                  sectionId: it.sectionId,
                  quantity: seat?.quantity,
                  price: info.price,
                })
              );
            }
          } else {
            orderItems.push(
              manager.create(OrderItem, {
                order_id: orderEntity.id,
                ticketTypeId: it.id,
                sectionId: it.sectionId,
                sectionName: it.sectionName,
                name: info.name,
                quantity: it.quantity,
                price: info.price,
              })
            );
          }
        }

        orderEntity.subtotalAmount = subtotal;
        orderEntity.totalAmount = subtotal;
        await manager.save(orderEntity);
        await manager.save(orderItems);
        return { order: orderEntity, items: orderItems };
      }
    );

    console.log("items", JSON.stringify(items, null, 2));

    // 5. Update seat availability cache
    const reservedSeatIds = items.map((i) => i.seatId).filter((id) => !!id);
    await this.seatService.updateShowSeatAvailabilityCache(
      dto.showId,
      reservedSeatIds
    );

    // 6. Build and persist booking payload + cleanup key
    const bookingData = {
      eventId: order.eventId,
      showingId: order.showId,
      bookingCode,
      subtotalAmount: order.subtotalAmount,
      totalAmount: order.totalAmount,
      expireIn: this.BOOKING_TTL,
      discountAmount: 0,
      discountCode: "",
      addressId: 0,
      ticketPrintingFee: 0,
      shippingFee: 0,
      step: "question_form",
      platformDiscountAmount: 0,
      orderId: order.id,
      items: items.map((item) => ({
        id: item.ticketTypeId,
        name: ticketInfoMap.get(item.ticketTypeId)!.name,
        price: item.price,
        quantity: item.quantity,
        rowLabel: item.rowLabel,
        seatNumber: item.seatNumber,
        sectionId: item.sectionId,
        sectionName: item.sectionName,
        seatId: item.seatId,
        discount: 0,
        discountCode: "",
      })),
    };

    await Promise.all([
      this.redisService.set(
        getBookingKey(dto.showId, bookingCode),
        JSON.stringify(bookingData)
      ),
      this.redisService.set(
        getBookingCleanupKey(dto.showId, bookingCode),
        "",
        this.BOOKING_TTL
      ),
    ]);

    return {
      success: true,
      code: bookingCode,
      expireIn: this.BOOKING_TTL,
      message: "",
      quote: {
        orderId: order.id,
        eventId: order.eventId,
        items: items.map((item) => ({
          name: item.name,
          id: item.ticketTypeId,
          sectionId: item.sectionId,
          sectionName: item.sectionName,
          quantity: item.quantity,
          seatId: item.seatId,
          rowLabel: item.rowLabel,
          seatNumber: item.seatNumber,
        })),
        expiredAt: reservedUntil.toISOString(),
        bookingCode,
        subtotalAmount: order.subtotalAmount,
        totalAmount: order.subtotalAmount,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        platform: dto.platform,
        timestamp: dto.timestamp,
      },
      traceId: uuidv4(),
    };
  }

  async getAvailableVouchers(eventId: number, showId: number) {
    try {
      const vouchers = await this.voucherRepository.find({
        where: {
          eventId,
          active: true,
          status: VoucherStatus.ACTIVE,
        },
      });

      return vouchers.filter((voucher) => {
        const now = new Date();
        const isWithinTimeRange =
          voucher.startTime <= now && now <= voucher.endTime;

        if (!isWithinTimeRange) return false;

        // Check if voucher applies to all showings or specific showing
        return (
          voucher.isAllShowings ||
          voucher.showingConfigs?.some((config) => config.id === showId)
        );
      });
    } catch (error) {
      this.logger.error("Error getting available vouchers:", error);
      throw error;
    }
  }

  async applyVoucher(showId: number, bookingCode: string, voucherCode: string) {
    try {
      const bookingJSON = await this.redisService.get(
        getBookingKey(showId, bookingCode)
      );
      const booking = JSON.parse(bookingJSON);

      if (!booking) {
        return MESSAGE.BOOKING_NOT_FOUND;
      }

      const voucher = await this.voucherRepository.findOne({
        where: {
          discountCode: voucherCode,
          active: true,
          status: VoucherStatus.ACTIVE,
          eventId: booking.eventId,
        },
      });

      if (!voucher) {
        return MESSAGE.VOUCHER_NOT_FOUND;
      }

      // Validate time range
      const now = new Date();
      if (now < voucher.startTime || now > voucher.endTime) {
        return MESSAGE.VOUCHER_EXPIRED;
      }

      // Validate showing
      if (
        !voucher.isAllShowings &&
        !voucher.showingConfigs?.some(
          (config) => config.id === booking.showingId
        )
      ) {
        return MESSAGE.VOUCHER_INVALID_SHOWING;
      }

      const showConfig = voucher.showingConfigs?.find(
        (config) => config.id === booking.showingId
      );

      // Filter items that are eligible for the voucher
      const eligibleItems = voucher.isAllShowings
        ? booking.items
        : booking.items.filter(
            (item) =>
              showConfig?.isAllTicketTypes ||
              showConfig?.ticketTypeIds.includes(item.ticketTypeId)
          );

      if (eligibleItems.length === 0) {
        return MESSAGE.VOUCHER_INVALID_TICKET_TYPES;
      }

      // Calculate total quantity only from eligible items
      const totalQuantity = eligibleItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Validate quantity
      if (!voucher.isUnlimited && voucher.quantity - totalQuantity <= 0) {
        return MESSAGE.VOUCHER_OUT_OF_STOCK;
      }

      if (
        voucher.minQtyPerOrder > 0 &&
        totalQuantity < voucher.minQtyPerOrder
      ) {
        return {
          ...MESSAGE.VOUCHER_MIN_QUANTITY,
          message: `Minimum ${voucher.minQtyPerOrder} tickets required for this voucher`,
        };
      }
      if (
        voucher.maxQtyPerOrder > 0 &&
        totalQuantity > voucher.maxQtyPerOrder
      ) {
        return {
          ...MESSAGE.VOUCHER_MAX_QUANTITY,
          message: `Maximum ${voucher.maxQtyPerOrder} tickets allowed for this voucher`,
        };
      }

      const discountAmount = this.calculateDiscount(
        voucher,
        booking,
        showConfig
      );

      await this.orderRepository.update(
        { bookingCode: booking.bookingCode },
        {
          platformDiscountAmount: discountAmount,
          totalAmount: booking.subtotalAmount - discountAmount,
        }
      );
      // Update voucher quantity
      if (!voucher.isUnlimited) {
        voucher.quantity -= totalQuantity;
        await this.voucherRepository.save(voucher);
      }

      // Update Redis booking data
      booking.discountAmount = discountAmount;
      booking.discountCode = voucherCode;
      booking.totalAmount = booking.subtotalAmount - discountAmount;
      await this.redisService.set(
        getBookingKey(showId, bookingCode),
        JSON.stringify(booking)
      );

      return {
        success: true,
        voucher,
        discountAmount,
      };
    } catch (error) {
      console.log(error);
      return MESSAGE.VOUCHER_CANNOT_BE_APPLIED;
    }
  }

  private calculateDiscount(
    voucher: any,
    booking: any,
    showConfig?: any
  ): number {
    const eligibleItems = voucher.isAllShowings
      ? booking.items
      : booking.items.filter(
          (item) =>
            showConfig?.isAllTicketTypes ||
            showConfig?.ticketTypeIds.includes(item.ticketTypeId)
        );

    const totalAmount = eligibleItems.reduce(
      (sum: number, ticket: any) => sum + ticket.price * ticket.quantity,
      0
    );

    if (voucher.discountType === "PERCENT") {
      return (totalAmount * voucher.discountValue) / 100;
    }

    return Math.min(voucher.discountValue, totalAmount);
  }

  async confirmPayment(bookingCode: string) {
    const order = await this.orderRepository.findOne({
      where: { bookingCode },
      relations: ["items"],
    });

    if (!order || order.status !== OrderStatus.PENDING) {
      throw new Error("Invalid or non-pending booking");
    }

    order.status = OrderStatus.PAID;
    await this.orderRepository.save(order);

    for (const item of order.items) {
      if (item.seatId) {
        await this.redisService.del(getSeatLockKey(item.seatId));
      }

      await this.ticketTypeRepository.increment(
        { id: item.ticketTypeId },
        "soldQuantity",
        item.quantity
      );
    }

    return order;
  }

  async getBookingStatus(showId: number, bookingCode: string) {
    const bookingKey = getBookingKey(showId, bookingCode);
    const bookingCleanupKey = getBookingCleanupKey(showId, bookingCode);
    const cached = await this.redisService.get(bookingKey);

    if (!cached) {
      return MESSAGE.BOOKING_NOT_FOUND;
    }

    const ttl = await this.redisService.ttl(bookingCleanupKey); // get remaining TTL in seconds
    const parsed = JSON.parse(cached);

    return {
      status: 1,
      message: "success",
      result: {
        ...parsed,
        expireIn: ttl >= 0 ? ttl : 0,
      },
      code: 0,
      traceId: uuidv4(),
    };
  }

  async cancelBooking(showId: number, bookingCode: string) {
    const order = await this.orderRepository.findOne({
      where: { bookingCode },
      relations: ["items"],
    });

    if (!order || order.status !== OrderStatus.PENDING) {
      throw new Error("Invalid or non-pending booking");
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    const seatsToAdd = order.items
      .filter((item) => item.seatId)
      .map((item) => ({
        id: item.seatId,
        sectionId: item.sectionId || "",
      }));

    if (seatsToAdd.length > 0) {
      await this.seatService.addSeatsToAvailabilityCache(showId, seatsToAdd);
    }

    this.redisService.del(getBookingKey(showId, bookingCode));
    this.redisService.del(getBookingCleanupKey(showId, bookingCode));

    for (const item of order.items) {
      if (item.seatId) {
        await this.redisService.del(getSeatLockKey(item.seatId));
      }

      if (item.sectionId) {
        await this.redisService.incrBy(
          getSectionLockKey(item.sectionId),
          item.quantity
        );
      }

      await this.redisService.incrBy(
        getTicketTypeLockKey(item.ticketTypeId),
        item.quantity
      );
    }

    return order;
  }

  async getFormAnswers(showId: number, bookingCode: string) {
    const bookingAnswersKey = getBookingAnswerKey(showId, bookingCode);
    const cached = await this.redisService.get(bookingAnswersKey);

    if (!cached) {
      return MESSAGE.BOOKING_ANSWERS_NOT_FOUND;
    }

    const parsed = JSON.parse(cached);

    return {
      status: 1,
      message: "success",
      result: parsed,
      code: 0,
      traceId: uuidv4(),
    };
  }

  async updateAnswers(questionAnswers: QuestionAnswerDto) {
    try {
      await this.redisService.set(
        getBookingAnswerKey(
          questionAnswers.showId!,
          questionAnswers.bookingCode!
        ),
        JSON.stringify(questionAnswers)
      );
      return { message: "Answers updated successfully" };
    } catch (error) {
      this.logger.error(
        `Failed to update answers: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async completeFreeOrder(orderId: number) {
    this.logger.log(`Starting free order completion for order ${orderId}`);

    try {
      await this.dataSource.transaction(async (manager) => {
        // 1. Get order with items and attendees
        this.logger.debug(`Fetching order ${orderId} with items`);
        const order = await manager.findOneOrFail(Order, {
          where: { id: orderId },
          relations: ["items"],
        });

        // 2. Verify that the order is actually free
        if (order.totalAmount > 0) {
          throw new Error(
            `Order ${orderId} is not free (total: ${order.totalAmount})`
          );
        }

        // 3. Update order status to PAID (even though it's free)
        order.status = OrderStatus.PAID;
        order.paidAt = new Date();
        await manager.save(order);

        // 4. Handle seats and ticket quantities (same as paid orders)
        await this.handleSeatsAndTickets(manager, order.items);

        // 5. Process booking answers if they exist
        const bookingAnswerKey = getBookingAnswerKey(
          order.showId,
          order.bookingCode
        );
        const bookingAnswerStr = await this.redisService.get(bookingAnswerKey);

        if (bookingAnswerStr) {
          this.logger.debug("Found booking answers, processing them");
          const bookingAnswers = JSON.parse(bookingAnswerStr);
          await this.processBookingAnswers(manager, order, bookingAnswers);
        } else {
          this.logger.debug("No booking answers found to process");
        }

        // 6. Increment event statistics
        await this.updateEventStatistics(order, manager);

        // 7. Cleanup Redis keys
        this.logger.debug("Cleaning up Redis keys");
        await this.cleanupRedisKeys(order, bookingAnswerKey);

        this.logger.log(`Successfully completed free order ${orderId}`);
      });

      const finalOrder = await this.dataSource
        .createQueryBuilder(Order, "order")
        .leftJoinAndSelect("order.attendees", "attendees")
        .leftJoinAndSelect("order.items", "items")
        .where("order.id = :orderId", { orderId })
        .getOneOrFail();

      // Get event info for confirmation email
      this.logger.debug("Fetching event details for confirmation email");
      const [eventInfo] = await this.dataSource.query(
        `
        SELECT 
          id,
          event_name as "eventName",
          event_description as "eventDescription",
          org_name as "orgName",
          org_description as "orgDescription",
          org_logo_url as "orgLogoUrl",
          event_logo_url as "eventLogoUrl",
          event_banner_url as "eventBannerUrl",
          venue_name as "venueName",
          street,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM events 
        WHERE id = $1
      `,
        [finalOrder.eventId]
      );

      if (!eventInfo) {
        throw new Error(`Event not found for order ${orderId}`);
      }

      // Send confirmation email for free order
      this.logger.debug("Sending confirmation email for free order");
      // await this.emailService.sendConfirmation(finalOrder, eventInfo);

      return {
        message: "Free order completed successfully",
        orderId: finalOrder.id,
        publicId: finalOrder.publicId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to complete free order ${orderId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  // Helper methods for free order completion
  private async handleSeatsAndTickets(manager: any, items: OrderItem[]) {
    // Implementation similar to the one in order.service.ts
    for (const item of items) {
      // Update ticket type sold quantity
      await manager.increment(
        TicketType,
        { id: item.ticketTypeId },
        "soldQuantity",
        item.quantity
      );
    }
  }

  private async processBookingAnswers(
    manager: any,
    order: Order,
    bookingAnswers: any
  ) {
    // Process booking answers similar to order.service.ts
    // This would involve creating attendee records and their answers
    // Implementation depends on your specific requirements
  }

  private async updateEventStatistics(order: Order, manager: any) {
    // Update event statistics for free orders
    await manager.save(EventStatistics, {
      eventId: order.eventId,
      ordersCompleted: 1,
      ticketsSold: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  private async cleanupRedisKeys(order: Order, bookingAnswerKey: string) {
    // Cleanup Redis keys
    const bookingKey = getBookingKey(order.showId, order.bookingCode);
    const cleanupKey = getBookingCleanupKey(order.showId, order.bookingCode);

    await this.redisService.del(bookingKey);
    await this.redisService.del(bookingAnswerKey);
    await this.redisService.del(cleanupKey);
  }
}
