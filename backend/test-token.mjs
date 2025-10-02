import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://cdndnwglcieylfgzbwts.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const token = readFileSync('/tmp/fresh_token.txt', 'utf8').trim();

const { data, error } = await supabase.auth.getUser(token);

console.log(JSON.stringify({ data, error }, null, 2));
