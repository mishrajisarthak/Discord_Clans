import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log("No profiles found in the database. You need to login with Discord first!");
    return;
  }
  
  console.log("Found profiles:", profiles.map(p => p.username));
  
  // Make the first profile the Owner
  const firstProfile = profiles[0];
  
  const { error: insertError } = await supabase.from('platform_roles').upsert({
    discord_user_id: firstProfile.discord_id,
    role_type: 'OWNER'
  }, { onConflict: 'discord_user_id' });
  
  if (insertError) {
    console.error("Error making user Owner:", insertError);
  } else {
    console.log(`Successfully made ${firstProfile.username} (${firstProfile.discord_id}) the Platform Owner!`);
  }
}

main();
