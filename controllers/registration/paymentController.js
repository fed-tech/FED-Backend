const { savePaymentDetails } = require("../../Services/paymentService");
const Razorpay = require("razorpay");
const crypto = require("crypto");




const initiatePayment = async (req, res) => {


  try {

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { eventId, amount } = req.body;
  
    console.log("incoming request ",req.body)
  
    // Input validation
    if (!eventId || !amount) {
      return res.status(400).json({
        success: false,
        message: "eventId and amount are required fields.",
      });
    }
    const order = await razorpay.orders.create({
      amount:amount * 100,
      currency : "INR"
    });
  
    if (!order) {
      return res.status(500).send("Error");
    }

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


const validatePayment = async (req, res) => {
  console.log("validatePayment called");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  //order_id + "|" + razorpay_payment_id
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
};

module.exports = { initiatePayment, validatePayment };


