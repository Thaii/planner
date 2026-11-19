import { openForm } from './sheet'
import { getS, update } from '@/lib/store'
import { greeting } from '@/lib/greeting'

/** Name, title and greeting settings. Used from the greeting's edit button and (later) the Customise page. */
export function personaliseForm() {
  const st = getS().settings
  openForm({
    title: 'Your name and greeting',
    fields: [
      { k: 'name', l: 'What should we call you? (optional)', v: st.name, ph: 'Your first name' },
      { k: 'nameInTitle', l: 'Planner title', t: 'select', o: [['yes', "Use my name (e.g. Thai's Planner)"], ['no', 'Keep it as “Life Planner”']], v: st.nameInTitle === false ? 'no' : 'yes' },
      { k: 'greeting', l: 'Custom greeting (optional)', v: st.greeting, ph: 'e.g. Let’s go, {name}!' },
    ],
    extra: (v) => (
      <p className="mt-2 mb-0 text-[12.5px] text-mute">
        Leave the greeting blank for Good morning / afternoon / evening. Type <b>{'{name}'}</b> where you want your name.<br />
        Preview: <b className="font-serif text-[15px] font-normal text-ink">{greeting({ name: v.name, greeting: v.greeting })}</b>
      </p>
    ),
    onSave: (v) => update((d) => { d.settings.name = v.name; d.settings.nameInTitle = v.nameInTitle !== 'no'; d.settings.greeting = v.greeting; d.settings.nameAsked = true }),
  })
}
