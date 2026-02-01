
const DodoPayments = require('dodopayments'); // Or how it is imported

// Initialize client
const client = new DodoPayments({
  bearerToken: '6pD6PpUM2ALAtces.GpPf_SC7tU6bCN5ANN6g8OakVaOWY7DoS7v3-iCK__EZ76CL', // DODO_SECRET_KEY
  environment: 'test_mode', // DODO_ENV
});

async function test() {
  try {
    console.log("Creating session...");
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: 'pdt_0NXUEYPN4KbaluF9re0OO', // DODO_PRODUCT_ID
          quantity: 1,
          amount: 100 // Test amount
        }
      ],
      billing_address: {
        city: 'New York',
        country: 'US',
        state: 'NY',
        street: '123 Test St',
        zipcode: '10001'
      },
      customer: {
        email: 'test@example.com',
        name: 'Test User'
      },
      return_url: 'http://localhost:8000/checkout',
      metadata: {
        cart_id: 'test_cart'
      }
    });

    console.log("Session created successfully:");
    console.log(JSON.stringify(session, null, 2));
    
    if (session.checkout_url) {
        console.log("✅ Checkout URL found:", session.checkout_url);
    } else {
        console.log("❌ Checkout URL NOT found!");
    }

  } catch (error) {
    console.error("Error creating session:", error);
  }
}

test();
