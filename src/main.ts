import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as compression from "compression";
import { Logger as PinoLogger } from "nestjs-pino";
import rateLimit from "express-rate-limit";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap() {
  try {
    // Create the application instance with specific configurations
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: {
        host: configService.get("REDIS_HOST") || "localhost",
        port: configService.get("REDIS_PORT") || 6379,
      },
    });

    await app.startAllMicroservices();

    const logger = new Logger("Bootstrap");

    // Use Pino Logger
    app.useLogger(app.get(PinoLogger));

    // Security middleware
    app.use(helmet());

    app.use(compression());

    // Rate limiting
    app.use(
      rateLimit({
        windowMs: configService.get("rateLimit.ttl") * 1000,
        max: configService.get("rateLimit.limit"),
      })
    );

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
  } catch (error) {
    new Logger("Bootstrap").error("Failed to start application", error);
    process.exit(1);
  }
}

bootstrap();
