const SUPABASE_URL = 'https://hnkohxlzlewynxbhrujd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua29oeGx6bGV3eW54YmhydWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjU2MjEsImV4cCI6MjA5MjcwMTYyMX0.hjA5KUV25YRJe6_yc6lXZ-CeSj-8PJr3PO1I0rvaayo';

async function check() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,stock_quantity,stock`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  console.log(await res.json());
}
check();
