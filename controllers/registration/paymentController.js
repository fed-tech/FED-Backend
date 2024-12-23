const { savePaymentDetails } = require("../../Services/paymentService");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Initiates a Razorpay payment order and saves payment details to the database.
 * @route POST /api/payment/initiate
 * @body {eventId: string, amount: number}
 */

// console.log("running")
const initiatePayment = async (req, res) => {
  const { eventId, amount } = req.body;

  // Input validation
  if (!eventId || !amount) {
    return res.status(400).json({
      success: false,
      message: "eventId and amount are required fields.",
    });
  }



  try {
    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${eventId}`,
    };

    const order = await razorpay.orders.create(options);

    // Save payment details to the database
    await savePaymentDetails({
      eventId,
      orderId: order.id,
      amount: order.amount,
      status: "PENDING",
    });

    // Respond with the order details
    res.status(200).json({
      success: true,
      message: "Payment initiated successfully.",
      order,
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment.",
      error: error.message,
    });
  }
};

module.exports = { initiatePayment };


