
// const fetch = require('node-fetch'); // Ensure node-fetch is available or use global fetch in Node 18+

const BASE_URL = "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "pk_4e5e929832e5a84f8a671766a38c7cdf90f8f39ee424b985a4c64394c4f7e335"; // If you have one, set it here

async function testDodoFlow() {
  console.log("🚀 Starting Dodo Payment Flow Test...");

  const headers = {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY
  };

  try {
    // 1. Get Region
    console.log("\n1️⃣  Fetching Regions...");
    const regionsRes = await fetch(`${BASE_URL}/store/regions`, { headers });
    
    if (!regionsRes.ok) {
        throw new Error(`Failed to fetch regions: ${regionsRes.status} ${regionsRes.statusText}`);
    }

    const regionsData = await regionsRes.json();
    
    if (!regionsData.regions?.length) {
      throw new Error("No regions found! Please seed your store with a region.");
    }
    const regionId = regionsData.regions[0].id;
    console.log(`   ✅ Region found: ${regionId}`);

    // 2. Get Product Variant
    console.log("\n2️⃣  Fetching Products...");
    const productsRes = await fetch(`${BASE_URL}/store/products`, { headers });
    const productsData = await productsRes.json();

    if (!productsData.products?.length) {
      throw new Error("No products found! Please create a product.");
    }
    
    const variantId = productsData.products[0].variants[0]?.id;
    if (!variantId) {
      throw new Error("Product has no variants!");
    }
    console.log(`   ✅ Variant found: ${variantId}`);

    // 3. Create Cart
    console.log("\n3️⃣  Creating Cart...");
    const cartRes = await fetch(`${BASE_URL}/store/carts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ region_id: regionId })
    });
    const cartData = await cartRes.json();
    const cartId = cartData.cart.id;
    console.log(`   ✅ Cart created: ${cartId}`);

    // 4. Add Line Item
    console.log("\n4️⃣  Adding Item to Cart...");
    const lineItemRes = await fetch(`${BASE_URL}/store/carts/${cartId}/line-items`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        variant_id: variantId,
        quantity: 1
      })
    });
    
    if (!lineItemRes.ok) {
        const err = await lineItemRes.json();
        throw new Error(`Failed to add item: ${JSON.stringify(err)}`);
    }
    console.log("   ✅ Item added to cart");

    // 5. Initialize Dodo Session
    console.log("\n5️⃣  Initializing Dodo Payment Session...");
    const sessionRes = await fetch(`${BASE_URL}/store/payments/dodo/session`, {
      method: "POST",
      headers,
      body: JSON.stringify({ cart_id: cartId })
    });

    console.log(`[${sessionRes.status}] ${sessionRes.statusText}`);
    const text = await sessionRes.text();
    try {
        const sessionData = JSON.parse(text);
        if (!sessionRes.ok) {
            throw new Error(`Failed to create session: ${JSON.stringify(sessionData)}`);
        }
        console.log("\n🎉 SUCCESS! Dodo Payment Session Created:");
        console.log("---------------------------------------------------");
        console.log(`Checkout URL: ${sessionData.checkout_url}`);
        console.log(`Session ID:   ${sessionData.session_id}`);
        console.log("---------------------------------------------------");
        console.log("\n👉 Open the Checkout URL in your browser to test the payment page.");
    } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw e;
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

testDodoFlow();
