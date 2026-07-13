import { createClient } from '@supabase/supabase-js'

// Strip surrounding quotes and whitespace/newlines — a common paste error when
// setting env vars in a hosting dashboard (e.g. Vercel), which otherwise makes
// supabase-js throw "Invalid supabaseUrl" and white-screen the whole app.
function clean(v: string | undefined): string {
  return (v ?? '').trim().replace(/^['"]|['"]$/g, '')
}

const url = clean(import.meta.env.VITE_SUPABASE_URL)
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

if (!url || !key) {
  throw new Error(
    'Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    '(in Vercel: Settings → Environment Variables, scoped to Production, then redeploy).'
  )
}

export const supabase = createClient(url, key)
