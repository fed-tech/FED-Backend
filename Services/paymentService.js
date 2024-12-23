const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.savePaymentDetails = async ({ eventId, paymentId, orderId, amount, status = "PENDING" }) => {
  try {
    const payment = await prisma.payment.create({
      data: {
        eventId,
        paymentId,
        orderId,
        amount,
        status,
      },
    });
    return payment;
  } catch (error) {
    console.error("Error saving payment details:", error);
    throw new Error("Failed to save payment details.");
  }
};

exports.updatePaymentStatus = async (orderId, status, paymentId = null) => {
  try {
    const payment = await prisma.payment.updateMany({
      where: { orderId },
      data: {
        status,
        paymentId,
      },
    });
    return payment;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error("Failed to update payment status.");
  }
};

exports.getPaymentDetails = async (orderId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });
    return payment;
  } catch (error) {
    console.error("Error retrieving payment details:", error);
    throw new Error("Failed to retrieve payment details.");
  }
};
