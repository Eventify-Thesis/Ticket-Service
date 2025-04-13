import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Order, OrderItem, OrderStatus } from "./entities/order.entity";
import { SubmitTicketInfoDto } from "./dto/submit-ticket-info.dto";
import { RedisService } from "../shared/redis/redis.service";
import { TicketType } from "./entities/ticket-type.entity";
import { MESSAGE } from "./booking.constants";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly BOOKING_TTL = 600; // seconds
  private readonly TICKET_TYPE_TTL = 3600; // seconds

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly redisService: RedisService
  ) {}

  private getSeatLockKey(seatId: string): string {
    return `seat:lock:${seatId}`;
  }

  private getTicketTypeLockKey(ticketTypeId: number): string {
    return `ticket-type:lock:${ticketTypeId}`;
  }

  private getSectionLockKey(sectionId: string): string {
    return `section:lock:${sectionId}`;
  }

  private getBookingKey(showId: number, bookingCode: string): string {
    return `booking:${showId}:${bookingCode}`;
  }

  async create(submitTicketInfoDto: SubmitTicketInfoDto) {
    const bookingCode = uuidv4();
    const now = new Date();
    const reservedUntil = new Date(now.getTime() + this.BOOKING_TTL * 1000);

    // 1. Check & Reserve Ticket Quantity in Redis
    for (const item of submitTicketInfoDto.items) {
      const ticketKey = this.getTicketTypeLockKey(item.id);
      const cacheTicketType = await this.redisService.get(ticketKey);
      let availableQty: number;
      if (cacheTicketType) {
        const object = JSON.parse(cacheTicketType);
        availableQty = parseInt(object.availableQty);
      } else {
        const ticketType = await this.ticketTypeRepository.findOneBy({
          id: item.id,
        });
        if (!ticketType) throw new Error(`Ticket type ${item.id} not found`);
        availableQty = ticketType.quantity - ticketType.soldQuantity;
        await this.redisService.set(
          ticketKey,
          JSON.stringify({ availableQty, price: ticketType.price }),
          this.TICKET_TYPE_TTL
        );
      }

      const requiredQty = item.quantity;
      if (availableQty < requiredQty) {
        return MESSAGE.TICKET_TYPE_QUANTITY_NOT_ENOUGH;
      }

      await this.redisService.decrBy(ticketKey, requiredQty);
    }

    // 2. Lock Seats in Redis
    for (const item of submitTicketInfoDto.items) {
      for (const seat of item.seats) {
        const seatKey = this.getSeatLockKey(seat.id.toString());
        const isLocked = await this.redisService.get(seatKey);
        if (isLocked) {
          return MESSAGE.SEAT_ALREADY_BOOKED;
        }
        await this.redisService.set(seatKey, bookingCode, this.BOOKING_TTL);
      }
    }

    // 3. Lock Sections in Redis
    for (const item of submitTicketInfoDto.items) {
      if (item.sectionId) {
        const sectionKey = this.getSectionLockKey(item.sectionId.toString());
        const isLocked = await this.redisService.get(sectionKey);
        if (isLocked) {
          return MESSAGE.SECTION_ALREADY_FULL;
        }
        await this.redisService.set(sectionKey, bookingCode, this.BOOKING_TTL);
      }
    }

    // 3. Create Order Record
    const orderItems = await Promise.all(
      submitTicketInfoDto.items.flatMap((item) =>
        item.seats.map(async (seat) => {
          const ticketTypeKey = this.getTicketTypeLockKey(item.id);
          const cacheTicketType = await this.redisService.get(ticketTypeKey);
          let price: number = 0;
          if (cacheTicketType) {
            const object = JSON.parse(cacheTicketType);
            price = object.price;
          } else {
            const ticketType = await this.ticketTypeRepository.findOne({
              where: { id: item.id },
            });
            price = ticketType.price;
            await this.redisService.set(
              ticketTypeKey,
              JSON.stringify({
                price,
                availableQty: ticketType.quantity - seat.quantity,
              }),
              this.TICKET_TYPE_TTL
            );
          }
          return {
            ticketTypeId: item.id,
            seatId: seat.id.toString(),
            quantity: seat.quantity,
            sectionId: item.sectionId,
            price,
          };
        })
      )
    );

    const subtotalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const order = this.orderRepository.create({
      userId: submitTicketInfoDto.userId,
      eventId: parseInt(submitTicketInfoDto.eventId),
      showId: parseInt(submitTicketInfoDto.showId),
      bookingCode,
      status: OrderStatus.PENDING,
      subtotalAmount,
      totalAmount: subtotalAmount,
      reservedUntil,
    });

    await this.orderRepository.save(order);
    await this.orderItemRepository.save(orderItems);

    const bookingData = {
      eventId: order.eventId,
      showingId: order.showId,
      bookingCode,
      subtotalAmount,
      totalAmount: subtotalAmount,
      expireIn: this.BOOKING_TTL,
      discountAmount: 0,
      discountCode: "",
      addressId: 0,
      ticketPrintingFee: 0,
      shippingFee: 0,
      step: "question_form",
      platformDiscountAmount: 0,
      items: orderItems.map((item) => ({
        id: item.ticketTypeId,
        name: "TODO", // you can fetch ticket type name or enrich later
        color: "TODO", // optionally enrich from ticket type metadata
        price: item.price,
        quantity: item.quantity,
        sectionId: item.sectionId,
        isReservingSeat: item.seatId !== null,
        seats: item.seatId ? [item.seatId] : null,
        discount: 0,
        discountCode: "",
      })),
    };

    const bookingKey = this.getBookingKey(order.showId, bookingCode);
    await this.redisService.set(
      bookingKey,
      JSON.stringify(bookingData),
      this.BOOKING_TTL
    );

    return {
      success: true,
      code: bookingCode,
      expireIn: this.BOOKING_TTL,
      message: "",
      quote: {
        orderId: order.id,
        eventId: order.eventId,
        items: order.items.map((item) => ({
          id: item.id,
          ticketTypeId: item.ticketTypeId,
          sectionId: item.sectionId,
          quantity: item.quantity,
          seatId: item.seatId,
        })),
        expiredAt: reservedUntil.toISOString(),
        bookingCode,
        subtotalAmount,
        totalAmount: subtotalAmount,
        totalQuantity: order.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        platform: submitTicketInfoDto.platform,
        timestamp: submitTicketInfoDto.timestamp,
      },
      traceId: uuidv4(),
    };
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
        await this.redisService.del(this.getSeatLockKey(item.seatId));
      }

      await this.ticketTypeRepository.increment(
        { id: item.ticketTypeId },
        "soldQuantity",
        item.quantity
      );
    }

    return order;
  }

  async getBooking(showId: number, bookingCode: string) {
    const bookingKey = this.getBookingKey(showId, bookingCode);
    const cached = await this.redisService.get(bookingKey);

    if (!cached) {
      return MESSAGE.BOOKING_NOT_FOUND;
    }

    const ttl = await this.redisService.ttl(bookingKey); // get remaining TTL in seconds
    const parsed = JSON.parse(cached);

    return {
      status: 1,
      message: "Thành công",
      data: {
        result: {
          ...parsed,
          expireIn: ttl >= 0 ? ttl : 0,
        },
      },
      code: 0,
      traceId: uuidv4(),
    };
  }

  async expireBooking(bookingCode: string) {
    const order = await this.orderRepository.findOne({
      where: { bookingCode },
      relations: ["items"],
    });

    if (!order || order.status !== OrderStatus.PENDING) {
      throw new Error("Invalid or non-pending booking");
    }

    order.status = OrderStatus.EXPIRED;
    await this.orderRepository.save(order);

    for (const item of order.items) {
      if (item.seatId) {
        await this.redisService.del(this.getSeatLockKey(item.seatId));
      }

      await this.redisService.incrBy(
        this.getTicketTypeLockKey(item.ticketTypeId),
        item.quantity
      );
    }

    return order;
  }
}
