import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => {
          const header = req.headers["x-request-id"];
          const existing = Array.isArray(header) ? header[0] : header;
          return existing ?? randomUUID();
        },
      },
    }),
  ],
})
export class ObservabilityModule {}
