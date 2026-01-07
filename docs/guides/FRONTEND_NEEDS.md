# 📋 Frontend API Requirements for Migration

This document lists the required API endpoints and logic that the new NestJS backend must provide to support the existing Angular Frontend.

**Current State**: Frontend uses `SupabaseDatabaseService` (Generic CRUD) + Custom RPC calls.
**Target State**: Frontend should call specific REST endpoints.

## 1. Authentication (AuthModule)
The frontend uses Supabase Auth. The backend must validate the `Bearer <token>` in every request.
- **Guard**: Global `JwtAuthGuard`.

## 2. Athletes (AthleteModule)
- **GET** `/athletes?boxId=<id>`
  - *Logic*: Return `profiles` joined with `box_memberships`.
- **GET** `/athletes/:id`
  - *Logic*: Return single profile.
- **DELETE** `/athletes/:id/membership` (or `/boxes/:boxId/members/:userId`)
  - *Logic*: Remove from `box_memberships`.

## 3. Disciplines (DisciplineModule)
- **GET** `/disciplines?boxId=<id>`
- **GET** `/disciplines/:id`
- **POST** `/disciplines`
- **PUT** `/disciplines/:id`
- **DELETE** `/disciplines/:id`

## 4. Schedules / Classes (ScheduleModule)
*Critical Complexity Here*

### Standard CRUD
- **GET** `/schedules?boxId=<id>&from=<date>&athleteId=<id>`
  - *Complex Logic*: Needs to return class details + `current_bookings` count + `user_has_booked` status.
  - Currently handles `waitlist` logic and `spots_available` calculation.
- **POST** `/schedules`
- **PUT** `/schedules/:id`
- **DELETE** `/schedules/:id`

### Business Actions (Move logic from Frontend to Backend)
- **POST** `/schedules/:id/cancel`
  - Body: `{ reason: string }`
- **POST** `/schedules/:id/reactivate`
- **POST** `/schedules/copy-week`
  - Body: `{ boxId, fromDate, toDate }`
  - *Logic*: Fetch source week classes, clone them to target week (stripping IDs/bookings).
- **POST** `/schedules/publish-week`
  - Body: `{ boxId, weekStart }`
  - *Logic*: Update `is_visible = true` for range.
- **GET** `/schedules/:id/availability`
  - *Logic*: (Legacy RPC `check_class_availability`) Check if spots > bookings.

## 5. Bookings (BookingModule)
- **GET** `/bookings/my-bookings`
  - Query: `?athleteId=<id>&boxId=<optional>`
  - *Logic*: Join `bookings` -> `schedules` -> `disciplines`.
- **POST** `/bookings`
  - Body: `{ scheduleId, athleteId }`
  - *Logic*: **Must check capacity first** (Race condition protection).
- **POST** `/bookings/:id/cancel` (or DELETE)
  - Body: `{ reason }`
- **POST** `/bookings/:id/check-in`

## 6. Templates (TemplateModule)
- **GET** `/templates?boxId=<id>`
- **GET** `/templates/:id` (Include Items)
- **POST** `/templates/:id/apply` 
  - Body: `{ targetDate }`
  - *Logic*: Read template items -> Calculate dates -> Insert into `schedules`.
- **POST** `/templates/from-week`
  - Body: `{ name, weekStart }`
  - *Logic*: Read `schedules` -> Convert to `week_template_items`.

---

## 💡 Migration Strategy for Backend Agent

1.  **Start with "Dumb" Resources**: Disciplines, Athletes.
2.  **Move to Core Entities**: Schedules, Bookings (just basic CRUD).
3.  **Implement Logic**: Move the `copyWeek`, `applyTemplate` logic from Angular `*.service.ts` to NestJS Services.
