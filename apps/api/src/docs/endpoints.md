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

## Audit actions
None yet. As feature modules land, log and document: `TEST_UPLOADED`, `ADMIN_CREATED`,
`ACCESS_GRANTED`, `ACCESS_REVOKED`, `USER_BLOCKED`/`USER_UNBLOCKED`, `PASSING_PCT_CHANGED`
(with old/new in `metadata`) — per AGENTS.md §6 rule 9.
