import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, MinLength } from "class-validator";

export class SearchInstrumentsQueryDto {
  @ApiProperty({
    description: "Ticker or name (partial, case-insensitive)",
    example: "ypf",
  })
  @Transform(({ value }): string | undefined =>
    typeof value === "string" ? value.trim() : undefined,
  )
  @IsString()
  @MinLength(1)
  q: string;
}
