import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import type { Request } from "express";

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const level = config.get<string>("app.logLevel") ?? "info";
        const pretty = config.get<boolean>("app.logPretty") ?? false;

        return {
          pinoHttp: {
            level,
            genReqId: (req: Request) => {
              const header = req.headers["x-request-id"];
              const existing = Array.isArray(header) ? header[0] : header;
              return existing ?? randomUUID();
            },
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "req.headers['x-api-key']",
                "req.headers['proxy-authorization']",
              ],
              censor: "[REDACTED]",
            },
            transport: pretty
              ? { target: "pino-pretty", options: { singleLine: true } }
              : undefined,
          },
        };
      },
    }),
  ],
})
export class ObservabilityModule {}
