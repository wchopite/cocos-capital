import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InstrumentsModule } from "../instruments/instruments.module";
import { CancelOrderUseCase } from "./application/use-cases/cancel-order.use-case";
import { GetHoldingsUseCase } from "./application/use-cases/get-holdings.use-case";
import { PlaceOrderUseCase } from "./application/use-cases/place-order.use-case";
import { CANCEL_ORDER } from "./domain/ports/in/cancel-order.port";
import { GET_HOLDINGS } from "./domain/ports/in/get-holdings.port";
import { PLACE_ORDER } from "./domain/ports/in/place-order.port";
import { ORDER_REPOSITORY } from "./domain/ports/out/order-repository.port";
import { QUOTE_PROVIDER } from "./domain/ports/out/quote-provider.port";
import { OrdersController } from "./infrastructure/http/orders.controller";
import { InstrumentsQuoteAdapter } from "./infrastructure/instruments/instruments-quote.adapter";
import { OrderOrmEntity } from "./infrastructure/persistence/entities/order.orm-entity";
import { TypeOrmOrderRepository } from "./infrastructure/persistence/repositories/order.repository";

@Module({
  imports: [TypeOrmModule.forFeature([OrderOrmEntity]), InstrumentsModule],
  controllers: [OrdersController],
  providers: [
    { provide: PLACE_ORDER, useClass: PlaceOrderUseCase },
    { provide: CANCEL_ORDER, useClass: CancelOrderUseCase },
    { provide: GET_HOLDINGS, useClass: GetHoldingsUseCase },
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
    { provide: QUOTE_PROVIDER, useClass: InstrumentsQuoteAdapter },
  ],
  exports: [GET_HOLDINGS],
})
export class OrdersModule {}
