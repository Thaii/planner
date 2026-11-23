/**
 * Three-way merge for syncing: `base` is the last version both sides agreed on, `local` is this device, `remote` is Drive.
 * Whatever changed on only one side wins; deletions are kept; lists of items with ids are merged item by item.
 * When both sides changed the same simple value, `prefer` decides.
 */
type Prefer = 'local' | 'remote'
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isIdList = (v: unknown): v is { id: string }[] => Array.isArray(v) && v.length > 0 && v.every((x) => isObj(x) && typeof x.id === 'string')

export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || !a || !b || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) { const bb = b as unknown[]; return a.length === bb.length && a.every((x, i) => same(x, bb[i])) }
  const ka = Object.keys(a as object).filter((k) => (a as Record<string, unknown>)[k] !== undefined)
  const kb = Object.keys(b as object).filter((k) => (b as Record<string, unknown>)[k] !== undefined)
  return ka.length === kb.length && ka.every((k) => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

export function merge3(base: unknown, local: unknown, remote: unknown, prefer: Prefer = 'local'): unknown {
  if (same(local, remote)) return local
  if (same(base, local)) return remote
  if (same(base, remote)) return local
  // Both changed.
  if (isObj(local) && isObj(remote)) {
    const b = isObj(base) ? base : {}, out: Record<string, unknown> = {}
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const v = merge3(b[k], local[k], remote[k], prefer)
      if (v !== undefined) out[k] = v
    }
    return out
  }
  const emptyOr = (v: unknown) => Array.isArray(v) && (v.length === 0 || isIdList(v))
  if (emptyOr(local) && emptyOr(remote) && (isIdList(local) || isIdList(remote))) return mergeList(base, local as { id: string }[], remote as { id: string }[], prefer)
  return prefer === 'remote' ? remote : local
}

function mergeList(base: unknown, local: { id: string }[], remote: { id: string }[], prefer: Prefer) {
  const B = new Map((isIdList(base) ? base : []).map((x) => [x.id, x]))
  const L = new Map(local.map((x) => [x.id, x])), R = new Map(remote.map((x) => [x.id, x]))
  const first = prefer === 'remote' ? remote : local, second = prefer === 'remote' ? local : remote
  const out: { id: string }[] = [], done = new Set<string>()
  for (const x of [...first, ...second]) {
    if (done.has(x.id)) continue
    done.add(x.id)
    const b = B.get(x.id), l = L.get(x.id), r = R.get(x.id)
    let v: unknown
    if (l && r) v = merge3(b, l, r, prefer)
    else if (l) v = b && same(b, l) ? undefined : l // deleted remotely and untouched here → stays deleted
    else v = b && same(b, r) ? undefined : r // deleted here and untouched remotely → stays deleted
    if (v) out.push(v as { id: string })
  }
  return out
}
