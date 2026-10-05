const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'b:/Aothen/aethon-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testInserts() {
  console.log('Testing inserts...');
  
  // 1. Try kind: 'staff', resident_id: null
  let { error: err1 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST01',
    kind: 'staff',
    facility_id: '00000000-0000-0000-0000-000000000000',
    created_by: '00000000-0000-0000-0000-000000000000',
    max_uses: 1
  }]);
  console.log('Test 1 (staff, no resident):', err1 ? err1.message : 'SUCCESS');

  // 2. Try kind: 'caregiver', resident_id: null
  let { error: err2 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST02',
    kind: 'caregiver',
    facility_id: '00000000-0000-0000-0000-000000000000',
    created_by: '00000000-0000-0000-0000-000000000000',
    max_uses: 1
  }]);
  console.log('Test 2 (caregiver, no resident):', err2 ? err2.message : 'SUCCESS');

  // 3. Try kind: 'family', resident_id: null
  let { error: err3 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST03',
    kind: 'family',
    facility_id: '00000000-0000-0000-0000-000000000000',
    created_by: '00000000-0000-0000-0000-000000000000',
    max_uses: 1
  }]);
  console.log('Test 3 (family, no resident):', err3 ? err3.message : 'SUCCESS');

  // 4. Try kind: 'family', with dummy resident_id
  let { error: err4 } = await supabaseAdmin.from('invite_codes').insert([{
    code: 'TEST04',
    kind: 'family',
    resident_id: '00000000-0000-0000-0000-000000000000',
    facility_id: '00000000-0000-0000-0000-000000000000',
    created_by: '00000000-0000-0000-0000-000000000000',
    max_uses: 1
  }]);
  console.log('Test 4 (family, with resident):', err4 ? err4.message : 'SUCCESS');

  // Delete test codes
  await supabaseAdmin.from('invite_codes').delete().like('code', 'TEST%');
}

testInserts();
