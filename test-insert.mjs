import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbcabxtvzoclzbfpgnlx.supabase.co';
const supabaseKey = 'sb_publishable_THbthWQC3ATyTyRdV9YWSg_eP0lNeRi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'gunjanroy4224@gmail.com',
    password: 'Gudiya@2502#Pulse'
  });
  
  if (authErr) {
    console.error("Auth Error:", authErr.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log("Logged in:", userId);

  const { data, error } = await supabase
      .from('rooms')
      .insert({ type: 'direct', created_by: userId })
      .select();

  console.log("Insert Response Data:", data);
  console.log("Insert Response Error:", error);
}

testInsert();
