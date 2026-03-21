import { supabase } from './supabase.js'

async function test() {
  const { data, error } = await supabase
    .from('students')
    .select('*')

  console.log(data, error)
}

test()