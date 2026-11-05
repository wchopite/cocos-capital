import { Transform, Type, plainToInstance } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from "class-validator";

const toBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return value === true || value === "true" || value === "1";
};

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  PORT?: number;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  LOG_PRETTY?: boolean;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  DB_PORT?: number;

  @IsOptional()
  @IsString()
  DB_USERNAME?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DB_DATABASE?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  DB_SSL?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  DB_SYNCHRONIZE?: boolean;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config);

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
