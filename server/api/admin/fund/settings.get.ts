import { useSupabase, toFundSettings } from '../../../utils/supabase'

export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data } = await sb.from('fund_settings').select('*').limit(1).maybeSingle()
  return data ? toFundSettings(data) : null
})
