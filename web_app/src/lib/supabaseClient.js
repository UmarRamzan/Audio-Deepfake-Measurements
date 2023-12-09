import { createClient } from '@supabase/supabase-js'

const url = 'https://uszazrcmrnbbknhzrzba.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzemF6cmNtcm5iYmtuaHpyemJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTA5MTUyNiwiZXhwIjoyMDE2NjY3NTI2fQ.1h27w-1YldgjKl2peTZCCUlIEiBc44VBxUTuTs5vpuc'

export const supabase = createClient(url, key)