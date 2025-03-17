"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const compression = require("compression");
const nestjs_pino_1 = require("nestjs-pino");
const express_rate_limit_1 = require("express-rate-limit");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ["error", "warn", "log", "debug", "verbose"],
        bufferLogs: true,
    });
    const configService = app.get(config_1.ConfigService);
    const logger = new common_1.Logger("Bootstrap");
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.setGlobalPrefix(configService.get("app.apiPrefix"));
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.use((0, express_rate_limit_1.default)({
        windowMs: configService.get("rateLimit.ttl") * 1000,
        max: configService.get("rateLimit.limit"),
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.enableCors({
        origin: configService.get("app.corsOrigins", "*"),
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Ticket Service API")
        .setDescription("High-performance ticket booking service for Eventify")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const port = configService.get("app.port");
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
    logger.log(`Swagger documentation is available at: ${await app.getUrl()}/api/docs`);
}
bootstrap().catch((error) => {
    new common_1.Logger("Bootstrap").error("Failed to start application", error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map