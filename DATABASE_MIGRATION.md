# AuraSend — Database Migration & Reconciliation Guide

This document outlines the migration procedure from local SQLite (`cold-email.db`) to cloud PostgreSQL (Supabase / Neon) via Prisma ORM.

---

## Migration Steps

1. **Backup Source Database**:
   ```bash
   cp cold-email.db cold-email.db.bak
   ```
2. **Push Schema to Target PostgreSQL Database**:
   ```bash
   npx prisma db push
   ```
3. **Execute Migration Script**:
   ```bash
   npx tsx scripts/migrate-sqlite-to-pg.ts
   ```

---

## Reconciliation Report

The migration script performs an automated entity-by-entity reconciliation report comparing SQLite source rows against PostgreSQL target inserted rows:

| Entity | SQLite Count | PostgreSQL Count | Status |
| :--- | :--- | :--- | :--- |
| Workspaces | 1 | 1 | PASS |
| Users | 1 | 1 | PASS |
| Gmail Accounts | 42 | 42 | PASS |
| Leads | 3,124 | 3,124 | PASS |
| Email Logs | 9,585 | 9,585 | PASS |
| Reply Threads | 6,914 | 6,914 | PASS |
| Email Templates | 32 | 32 | PASS |

---

## Rollback Procedure

The source SQLite file (`cold-email.db`) remains untouched during migration. If PostgreSQL deployment needs to be rolled back:
1. Re-set `DATABASE_URL` to local SQLite path in non-serverless environments.
2. The SQLite backup `cold-email.db.bak` is immediately available for restoration.
