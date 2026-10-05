const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'b:/Aothen/aethon-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testInserts() {
  let { data: resident } = await supabaseAdmin.from('residents').select('id, facility_id').limit(1).single();
  let resId = resident.id;
  let facId = resident.facility_id;
  let { data: user } = await supabaseAdmin.from('user_profiles').select('id').limit(1).single();

  let { error: err3 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST03',
    kind: 'family',
    resident_id: resId,
    facility_id: facId,
    created_by: user.id,
    max_uses: 1,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }]);
  console.log('Test 3 (family WITH resident):', err3 ? err3.message : 'SUCCESS');

  await supabaseAdmin.from('invite_codes').delete().eq('code', 'TEST03');
}

testInserts();
