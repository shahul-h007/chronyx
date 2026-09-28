const SUPABASE_URL = 'https://hnkohxlzlewynxbhrujd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua29oeGx6bGV3eW54YmhydWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjU2MjEsImV4cCI6MjA5MjcwMTYyMX0.hjA5KUV25YRJe6_yc6lXZ-CeSj-8PJr3PO1I0rvaayo';

async function testRpc() {
  try {
    console.log('Fetching products...');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,stock_quantity`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const products = await res.json();
    console.log('Products:', products);
    
    if (products.length > 0) {
      const clock = products.find(p => p.name === 'Wooden clock');
      if (clock) {
        console.log('Attempting to decrement stock for:', clock.id);
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/decrement_stock`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ product_id: clock.id, quantity: 1 })
        });
        
        console.log('RPC Status:', rpcRes.status);
        const rpcText = await rpcRes.text();
        console.log('RPC Response:', rpcText);

        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,stock_quantity`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        console.log('Products after:', await res2.json());
      }
    }
  } catch (err) {
    console.error(err);
  }
}
testRpc();
