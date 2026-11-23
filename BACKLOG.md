# Backburner

Ideas we've agreed are good but parked for later.

- **Celebrations for finishing things** – small confetti when a task is finished from the 5-minute timer; full confetti when all of today's to-dos or all three priorities are done. Everyday ticks stay quiet. Add a Celebrations on/off switch in Customise and respect "reduce motion".
- **Photos inside notebook text** – needs a rich-text editor; photos currently sit in a strip under the page.
- **Push notifications** – medication reminders and timers that ring with the screen locked (needs a small server, e.g. a Cloudflare Worker).
- **App icon badge and long-press shortcuts** (Quick add, Today, Focus).
- **Native app wrapper (Capacitor)** – App Store / Play Store, widgets, Apple Calendar. Only if friends want it.

## Next up in the main plan

1. Google Cloud setup (Thai does the clicks).
2. Google sign-in, Drive sync (private app folder), Google Calendar (read-only).
   - On the back burner (23 Nov): sync across devices via each person's own Drive app-data folder – no server of ours in between.
   - Merge item by item when two devices changed things offline (never last-save-wins).
   - Optional passphrase so data is encrypted before it leaves the device (can't be recovered if forgotten).
3. Apple / Outlook calendar links via a Cloudflare Worker.
