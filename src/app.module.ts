import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { InstrumentsModule } from "./instruments/instruments.module";
import {
  appConfig,
  databaseConfig,
} from "./shared/infrastructure/config/configuration";
import { validateEnv } from "./shared/infrastructure/config/env.validation";
import { DatabaseModule } from "./shared/infrastructure/database/database.module";
import { HealthModule } from "./shared/infrastructure/health/health.module";
import { AllExceptionsFilter } from "./shared/infrastructure/http/all-exceptions.filter";
import { DomainExceptionFilter } from "./shared/infrastructure/http/domain-exception.filter";
import { ObservabilityModule } from "./shared/infrastructure/observability/observability.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig],
    }),
    ObservabilityModule,
    DatabaseModule,
    HealthModule,
    InstrumentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
