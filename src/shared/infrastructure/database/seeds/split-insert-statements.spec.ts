import { splitInsertStatements } from "./split-insert-statements";

describe("splitInsertStatements", () => {
  it("splits INSERT statements, ignoring semicolons inside -- comments", () => {
    const sql = [
      "INSERT INTO instruments (ticker) VALUES ('A');",
      "",
      "INSERT INTO orders (instrumentId, side, status)",
      "VALUES",
      "  -- comment with a ; semicolon inside",
      "  (1, 'BUY', 'FILLED');",
    ].join("\n");

    const statements = splitInsertStatements(sql);

    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain("INSERT INTO instruments");
    expect(statements[1]).toContain("INSERT INTO orders");
    expect(statements[1]).toContain("(1, 'BUY', 'FILLED')");
  });

  it("strips inline -- comments", () => {
    const sql = [
      "INSERT INTO orders (side, status)",
      "VALUES ('LIMIT', 'NEW'); -- inline comment with ; semicolon",
    ].join("\n");

    const statements = splitInsertStatements(sql);

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain("('LIMIT', 'NEW')");
    expect(statements[0]).not.toContain("inline comment");
  });

  it("ignores non-INSERT statements (e.g. CREATE TABLE)", () => {
    const sql = [
      "CREATE TABLE users (id INT);",
      "INSERT INTO users (id) VALUES (1);",
    ].join("\n");

    const statements = splitInsertStatements(sql);

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain("INSERT INTO users");
  });
});
