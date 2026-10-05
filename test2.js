const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'b:/Aothen/aethon-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testInserts() {
  // Try to insert a staff invite with a REAL resident_id
  let { data: resident } = await supabaseAdmin.from('residents').select('id').limit(1).single();
  let resId = resident ? resident.id : '00000000-0000-0000-0000-000000000000';
  let { data: facility } = await supabaseAdmin.from('facilities').select('id').limit(1).single();
  let facId = facility ? facility.id : '00000000-0000-0000-0000-000000000000';

  let { error: err1 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST01',
    kind: 'staff',
    facility_id: facId,
    created_by: '00000000-0000-0000-0000-000000000000'
  }]);
  console.log('Test 1 (staff, NO resident):', err1 ? err1.message : 'SUCCESS');

  let { error: err2 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST02',
    kind: 'staff',
    resident_id: resId,
    facility_id: facId,
    created_by: '00000000-0000-0000-0000-000000000000'
  }]);
  console.log('Test 2 (staff, WITH resident):', err2 ? err2.message : 'SUCCESS');
}

testInserts();
