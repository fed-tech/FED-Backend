// controllers/form/analytics.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');
const expressAsyncHandler = require('express-async-handler');
const status = require("http-status");

// @description     Form analytics
// @route           GET /api/form/formAnalytics/:id
// @access          ADMIN
const analytics = expressAsyncHandler(async (req, res, next) => {

  const allowedUsers = [
    "ADMIN",
    "PRESIDENT",
    "VICEPRESIDENT",
    "DIRECTOR_CREATIVE",
    "DIRECTOR_TECHNICAL",
    "DIRECTOR_MARKETING",
    "DIRECTOR_OPERATIONS",
    "DIRECTOR_SPONSORSHIP"
  ]
  if (!allowedUsers.includes(req.user.access) && req.user.email != "srex@fedkiit.com") {
    return next(new ApiError(status.UNAUTHORIZED, "Access Denied"))
  }

  try {
    console.log("entering form analytics")
    const { id: formId } = req.params;
    let form = await prisma.form.findUnique({
      where: { id: formId },
      include: { 
        formAnalytics: true,
        sections: false,
        userReg: {
          select: {
            userId: true,
            paymentStatus: true
          }
        }
      }
    });
    console.log("form", form);
    if (form.formAnalytics.length === 0) {
      return next(new ApiError(status.NOT_FOUND, "No users have registered to this form yet"))
    }

    let formAnalytics = form.formAnalytics[0];
    let yearCounts;
    console.log("form analytics : ", formAnalytics);
    
    try {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: formAnalytics.regUserEmails,
          },
        },
      });

      // Create a map of user IDs to payment status
      const paymentStatusMap = form.userReg.reduce((acc, reg) => {
        acc[reg.userId] = reg.paymentStatus;
        return acc;
      }, {});

      // Add payment status to users
      const usersWithPaymentStatus = users.map(user => ({
        ...user,
        paymentStatus: paymentStatusMap[user.id] || 'PENDING'
      }));

      // Separate users by payment status
      const paidUsers = usersWithPaymentStatus.filter(user => user.paymentStatus === 'COMPLETED');
      const pendingUsers = usersWithPaymentStatus.filter(user => user.paymentStatus === 'PENDING');

      // Calculate year counts for both paid and pending users
      yearCounts = {
        paid: paidUsers.reduce((acc, obj) => {
          let year = null;
          if(obj.year)
            year = obj.year.split(' ')[0];
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {}),
        pending: pendingUsers.reduce((acc, obj) => {
          let year = null;
          if(obj.year)
            year = obj.year.split(' ')[0];
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {})
      };

      // Add payment status information to form analytics
      formAnalytics.paidUsers = paidUsers.map(user => user.email);
      formAnalytics.pendingUsers = pendingUsers.map(user => user.email);

    } catch (error) {
      console.error("Error fetching all the users form the array list", error);
    }

    console.log("year counts : ", yearCounts);
    return res.status(200).json({ message: "success", form: form, yearCounts });
  } catch (error) {
    console.log(error)
    next(new ApiError(status.INTERNAL_SERVER_ERROR, "Internal Server Error", error));
  }
});



// const addClickCount = expressAsyncHandler(async (req, res, next) => {
//   const { formId } = req.body;

//   await prisma.model.update({
//     where: { id: formId },
//     data: { value: { increment: 1 } }
//   });

//   return res.status(200).json({ message: "Click count incremented" });
// });

module.exports = { analytics };
