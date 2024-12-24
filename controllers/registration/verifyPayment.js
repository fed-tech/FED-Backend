const crypto = require("crypto");
const { updatePaymentStatus } = require("../../Services/paymentService");

const verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === signature) {
      // Update payment status to SUCCESS
      await updatePaymentStatus(orderId, "SUCCESS", paymentId);

      res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
      });
    } else {
      // Update payment status to FAILED
      await updatePaymentStatus(orderId, "FAILED");

      res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    res.status(500).json({
      success: false,
      message: "Error verifying payment.",
      error: error.message,
    });
  }
};

module.exports = { verifyPayment };
