# Endpoints

Legend — **Auth**: `Public` (no token), `Any` (any authenticated user), or a role list.
Request/response shapes live in `packages/shared` where shared with the web app.

## Health
| Method | Path      | Auth   | Request | Response                              |
| ------ | --------- | ------ | ------- | ------------------------------------- |
| GET    | `/health` | Public | —       | `{ status: "ok", timestamp: string }` |

## Auth
| Method | Path          | Auth   | Request (DTO / shared)        | Response                         |
| ------ | ------------- | ------ | ----------------------------- | -------------------------------- |
| POST   | `/auth/login` | Public | `loginSchema` `{ identifier, password }` | `loginResponseSchema` `{ accessToken, user }` |
| GET    | `/auth/me`    | Any    | —                             | `authUserSchema` (live user)     |

`authUserSchema` = `{ id, name, email|null, username|null, role, isActive }` (never the password hash).

## Tests (SuperAdmin only)
All routes require role `SUPERADMIN`. Shapes in `packages/shared` (`test.ts`).
| Method | Path | Request | Response |
| ------ | ---- | ------- | -------- |
| GET | `/tests` | — | `testSchema[]` (newest first) |
| POST | `/tests` | `createTestSchema` `{ name, description?, passingPct 1–100 }` | `testSchema`. Audit `TEST_CREATED`. |
| GET | `/tests/:id` | — | `testSchema` (404 if absent) |
| PATCH | `/tests/:id` | `updateTestSchema` `{ name?, description?, passingPct?, isActive? }` | `testSchema`. **If locked**: `passingPct` change → 403; name/description/isActive allowed. Passing-% change → audit `PASSING_PCT_CHANGED` (old/new); else `TEST_UPDATED`. |
| DELETE | `/tests/:id` | — | `{ id }`. 409 if the test has attempts. Cascades to questions. Audit `TEST_DELETED`. |

## Questions (SuperAdmin only) — nested under a test
| Method | Path | Request | Response |
| ------ | ---- | ------- | -------- |
| GET | `/tests/:testId/questions` | — | `questionSchema[]` (ordered by `orderNum`) |
| POST | `/tests/:testId/questions/upload/preview` | multipart `file` (.xlsx/.xls/.csv) | `uploadPreviewSchema` — parsed rows + per-row errors, **no DB write** |
| POST | `/tests/:testId/questions/upload/commit` | multipart `file` | `{ inserted }`. Re-validates server-side; **400** if any row invalid or sheet empty; **403** if test locked. Replaces the question set (replace-all) + sets `totalQuestions`. Audit `TEST_UPLOADED`. |

Upload parsing (`questions/sheet-parser.ts`): SheetJS reads `.xlsx`/`.xls`/`.csv`; headers matched
case/space-insensitively; `Answer` resolves a letter A–E or matches full option text; rows missing
question/A/B or with an unresolvable answer are flagged. File validated by `SheetFilePipe`
(extension + 5 MB limit).

## Audit actions (so far)
`TEST_CREATED`, `TEST_UPDATED`, `TEST_DELETED`, `TEST_UPLOADED`, `PASSING_PCT_CHANGED`
(old/new in `metadata`). Constants in `src/audit/audit.actions.ts`. Later phases add
`ADMIN_CREATED`, `ACCESS_GRANTED`, `ACCESS_REVOKED`, `USER_BLOCKED`/`USER_UNBLOCKED`
(AGENTS.md §6 rule 9).
