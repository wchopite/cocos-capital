import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import {
  appConfig,
  databaseConfig,
} from "./shared/infrastructure/config/configuration";
import { validateEnv } from "./shared/infrastructure/config/env.validation";
import { DatabaseModule } from "./shared/infrastructure/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig],
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
