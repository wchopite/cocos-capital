import type { MigrationInterface } from "typeorm";
import { AddOrderCurrency1794500000000 } from "./1794500000000-AddOrderCurrency";
import { AddOrderIdempotencyKey1793840073976 } from "./1793840073976-AddOrderIdempotencyKey";
import { InitialSchema1793807788545 } from "./1793807788545-InitialSchema";

export const migrations: (new () => MigrationInterface)[] = [
  InitialSchema1793807788545,
  AddOrderIdempotencyKey1793840073976,
  AddOrderCurrency1794500000000,
];
