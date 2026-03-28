import Razorpay from "razorpay";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

/* CREATE PAYMENT ORDER */

export const createPayment = async (req, res) => {
  try {
    const razorpay = getRazorpayClient();

    if (!razorpay) {
      return res.status(503).json({
        message: "Razorpay is not configured on the server"
      });
    }

    const options = {
      amount: 5000 * 100,
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
