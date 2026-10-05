const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'b:/Aothen/aethon-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function findDummy() {
  let { data, error } = await supabaseAdmin.from('residents').select('id, first_name, last_name, facility_id');
  console.log(data);
}
findDummy();
