const { savePaymentDetails } = require("../../Services/paymentService");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const initiatePayment = async (req, res) => {
  const { eventId, amount } = req.body;

  console.log("incoming request ",req.body)

  // Input validation
  if (!eventId || !amount) {
    return res.status(400).json({
      success: false,
      message: "eventId and amount are required fields.",
    });
  }

  try {
    const order = await razorpay.orders.create({
      amount:amount * 100,
      currency : "INR"
    });

    // Save payment details to the database
    // await savePaymentDetails({
    //   eventId,
    //   orderId: order.id,
    //   amount: order.amount,
    //   status: "PENDING",
    // });

    // Respond with the order details
    res.status(200).json({
      success: true,
      message: "Payment initiated successfully.",
      orderId:order.id,
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


