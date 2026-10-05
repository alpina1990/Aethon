const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'b:/Aothen/aethon-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testInserts() {
  let { data: facility } = await supabaseAdmin.from('facilities').select('id').limit(1).single();
  let facId = facility.id;
  let { data: user } = await supabaseAdmin.from('user_profiles').select('id').limit(1).single();

  const kinds = ['staff', 'caregiver', 'admin', 'nurse', 'facility_admin', 'superadmin', 'family'];

  for (let kind of kinds) {
    let { error } = await supabaseAdmin.from('invite_codes').insert([{
      code: 'TEST_' + kind.substring(0, 4).toUpperCase(),
      kind: kind,
      facility_id: facId,
      created_by: user.id,
      max_uses: 1,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }]);
    console.log(`Test ${kind}:`, error ? error.message : 'SUCCESS');
  }

  await supabaseAdmin.from('invite_codes').delete().like('code', 'TEST_%');
}

testInserts();
