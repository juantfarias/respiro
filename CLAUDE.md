# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured. TypeScript errors are intentionally ignored at build time (`ignoreBuildErrors: true` in [next.config.mjs](next.config.mjs)).

## Product Overview

**Respiro** targets remote workers with flexible schedules. The goal is to help users organize personal interests (hobbies, study sessions, breaks) and interrupt procrastination cycles through randomized reminders within configurable time windows. The MVP is entirely client-side — no backend.

### User Stories

- **US01:** Register an activity with a name (e.g. "Read a book").
- **US02:** Define days of the week and a time window (e.g. Wednesdays, 07:00–11:00).
- **US03:** Define the desired duration for the activity in minutes.
- **US04:** Receive a browser push notification at a *random* moment within the defined time window.
- **US05:** Start the activity from the notification and see a countdown timer (Focus Mode).
- **US06:** Have the activity marked as completed in history when the timer reaches zero.
- **US07:** View a history log of activities (Completed vs. Missed).
- **US08:** Click a "Missed" activity in history and execute it immediately, updating its status.

### Business Rules

1. **Availability window:** The system crosses the current day/time against each activity's settings. Only activities within their window are active.
2. **Random notification:** When a window opens, the system calculates the remaining time until the window closes and uses `Math.random()` to schedule the notification (via `setTimeout`) at a surprise moment within that interval.
3. **Focus lock:** While a countdown is running, the system pauses/ignores notifications from other activities.
4. **Log generation:**
   - **COMPLETED:** Log created automatically when the user finishes a focus timer.
   - **MISSED:** If a time window has passed today and no COMPLETED log exists for that activity, a MISSED log is created.
5. **Late execution:** If a MISSED log is started manually via the History screen, scheduling rules are bypassed. When finished, the log transitions from MISSED to COMPLETED.

## Architecture

Single-page Next.js app (React 19, App Router).

### Data model

All state is persisted to `localStorage` with two keys:
- `respiro_activities` — list of activity objects: `{ id, name, days: number[], startTime: "HH:MM", endTime: "HH:MM", duration: number (minutes) }`
- `respiro_history` — list of log objects: `{ id, activityId, activityName, date: ISO string, status: "COMPLETED" | "MISSED", duration }`

### State and flow

All state lives in [app/page.jsx](app/page.jsx) (the only route). The main page manages:
- `activities` — registered activities
- `historyLogs` — execution history
- `focusActivity` — the activity currently in focus mode (renders `FocusTimer` exclusively when set)
- `recoveryLogId` — tracks when the user is retrying a MISSED activity (updates existing log to COMPLETED instead of creating a new one)

### Notification scheduling

[hooks/useNotificationScheduler.js](hooks/useNotificationScheduler.js) runs a `setInterval` every 60 seconds to:
1. **Schedule notifications**: For each activity whose time window is currently active, pick a random moment within the remaining window and schedule a browser `Notification`. Clicking the notification calls `onStartFocus`.
2. **Mark missed activities**: If a time window has passed and no log exists for today, call `onAddMissedLog` to create a `MISSED` entry. Uses `missedCheckedToday` ref to avoid duplicates within a session.

State is tracked via refs (`scheduledTimeouts`, `notifiedToday`, `missedCheckedToday`) that reset at midnight.

### Components

- [components/respiro/ActivityForm.jsx](components/respiro/ActivityForm.jsx) — form for creating activities; validates that duration fits within the time window
- [components/respiro/ActivityList.jsx](components/respiro/ActivityList.jsx) — renders activity cards with start-focus and delete actions
- [components/respiro/ActivityCard.jsx](components/respiro/ActivityCard.jsx) — individual activity display
- [components/respiro/ActivityHistory.jsx](components/respiro/ActivityHistory.jsx) — history log with ability to retry MISSED activities
- [components/respiro/FocusTimer.jsx](components/respiro/FocusTimer.jsx) — full-screen countdown timer with circular SVG progress, pause/resume, and Web Audio API completion sound

### UI library

`components/ui/` contains shadcn/ui components (Radix UI primitives + Tailwind). The app uses Tailwind CSS v4 with CSS variables for theming. The respiro-specific components do **not** use shadcn components — they use raw Tailwind classes directly. The design must be responsive across mobile and desktop.