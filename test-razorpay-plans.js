const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    console.log('Fetching plans...');
    const plans = await razorpay.plans.all();
    console.log('Plans:', plans);
  } catch (err) {
    console.error('Error fetching plans:', err);
  }
}
run();
