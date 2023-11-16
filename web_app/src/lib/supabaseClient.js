import { createClient } from '@supabase/supabase-js'

const url = 'https://drfpmcuhpzmqnslnixwx.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZnBtY3VocHptcW5zbG5peHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAzODUxOSwiZXhwIjoyMDE1NjE0NTE5fQ.ZFivrD4oYE5gXZLKhAc3IZLObVWJz00VdaN1kN9dw9Y'

export const supabase = createClient(url, key)