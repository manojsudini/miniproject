import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* CREATE PAYMENT ORDER */

export const createPayment = async (req, res) => {

  try {

    const options = {
      amount: 5000 * 100, // ₹5000
      currency: "INR",
      receipt: "promotion_payment"
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Payment creation failed"
    });

  }

};