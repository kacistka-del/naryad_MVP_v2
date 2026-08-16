# Base44 data export

This directory holds the raw CSV backups exported from Base44 on 2026-08-16. The files are copied without transformations and retain the original Base44 identifiers, which makes them suitable as a source for a future migration.

| Table | File | Rows |
| --- | --- | ---: |
| Executor | `executors.csv` | 5 |
| Category | `categories.csv` | 52 |
| BoardListing | `board-listings.csv` | 50 |
| AdminAuditLog | `admin-audit-log.csv` | 5 |
| SystemSetting | `system-settings.csv` | 7 |
| OrderStatusHistory | `order-status-history.csv` | 4 |
| Order | `orders.csv` | 2 |

The CSV files are plain text but are deliberately excluded from Git because the `Executor` and `Order` exports can contain contacts and phone numbers. Keep them locally or import them into the replacement database during migration.
