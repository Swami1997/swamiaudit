import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nahcyerhpapwdewjbjpi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haGN5ZXJocGFwd2Rld2pianBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjI1NjIwOCwiZXhwIjoyMDQ3ODMyMjA4fQ.FUoJXEaaFanBWOiggWl6_e6Xi8S0hn7ZjCuWq9Jd4r4';

export const supabase = createClient(supabaseUrl, supabaseKey);