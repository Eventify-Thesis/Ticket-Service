import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { RedisService } from "./redis.service";

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot()
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
