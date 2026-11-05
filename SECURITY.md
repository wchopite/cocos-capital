# Security Policy

## Reporting a vulnerability

If you find a security issue, please report it privately. Do not open a public issue.

## What we do

- Helmet and CORS on the HTTP layer.
- Input validation with class-validator (whitelist).
- Parameterized queries via TypeORM (no raw SQL interpolation).
- No authentication is implemented (challenge scope); the user id is passed explicitly.
