# Life Planner

A planner for your days, habits, goals, wellbeing and home – built for ADHD brains.
Your data stays on your own device (and, soon, in your own Google Drive).

**Live app:** https://thaii.github.io/planner/

## What's here so far (batch 1)

- **Today** – hour-by-hour schedule, Next up with a 5-minute start, who you're becoming, top 3, to-dos (with carry-over and repeats), habits with minimum/full, check-in, gratitude, brain dump, dopamine menu picks and more. Cards can be switched on/off and reordered.
- **Weekly** – week priorities, goals and to-do, plus the 7-day spread.
- **Monthly** – month grid with colour-coded days, month to-do and reflection.
- Search and jump with **Ctrl/⌘ K**, quick add, undo on deletes, 7 day and 7 night themes.

Coming next: Yearly, Habits, Goals, Projects, Wellness, Dopamine menu, Food & fitness, Home, Lists, Travel, Notebook, Life reset, Focus, Customise; then install/offline, then Google Drive and Google Calendar sync.

## Tech

React 19 + TypeScript + Vite, Tailwind CSS v4, Radix primitives in the shadcn/ui pattern,
Sonner (toasts), Vaul (drawers), cmdk (command menu), NumberFlow (animated numbers),
zustand + immer for state, IndexedDB (idb-keyval) for on-device storage.

## Run it locally

```bash
npm install
npm run dev
```

Pushing to `main` deploys to GitHub Pages automatically (see `.github/workflows/deploy.yml`).

## Your data

Everything is saved in your browser's storage on your device. Nothing is sent to any server.
Install it to your home screen (Share → Add to Home Screen on iPhone) so iOS doesn't clear it.
