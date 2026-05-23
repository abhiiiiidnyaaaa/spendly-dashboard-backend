const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    console.log('Creating customer...');
    const customer = await razorpay.customers.create({
      name: 'Test User',
      email: 'test@example.com',
    });
    console.log('Customer created:', customer.id);

    console.log('Creating subscription...');
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PRO_PLAN_ID,
      customer_id: customer.id,
      total_count: 12,
    });
    console.log('Subscription created:', subscription.id);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
