import { DefaultNamingStrategy } from "typeorm";

export class LowerCaseNamingStrategy extends DefaultNamingStrategy {
  public columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    if (embeddedPrefixes.length > 0) {
      return super.columnName(
        propertyName,
        customName ?? propertyName,
        embeddedPrefixes,
      );
    }

    return customName ?? propertyName.toLowerCase();
  }
}
