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
  // Create the application instance with specific configurations
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
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

  // CORS configuration
  app.enableCors({
    origin: configService.get("app.corsOrigins", "*"),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Ticket Service API")
    .setDescription("High-performance ticket booking service for Eventify")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: "127.0.0.1",
      port: 8082,
    },
  });

  await app.startAllMicroservices();
}

bootstrap().catch((error) => {
  new Logger("Bootstrap").error("Failed to start application", error);
  process.exit(1);
});
