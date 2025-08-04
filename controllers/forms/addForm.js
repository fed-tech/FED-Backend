const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const uploadimage = require("../../utils/image/uploadImage");
const status = require("http-status");

const FormImageHeight = 350.67;
const FormImageWidth = 196.37;

// @description     Add regForm
// @route           POST /api/form/addForm
// @access          Admins
const addForm = async (req, res, next) => {
  try {
    const {
      eventTitle,
      eventdescription,
      eventDate,
      eventType,
      paymentLink,  // Payment link field
      eventAmount,
      upi,          // UPI field
      eventMaxReg,
      relatedEvent,
      participationType,
      maxTeamSize,
      minTeamSize,
      regDateAndTime,
      eventPriority,
      successMessage,
      isPublic,
      isRegistrationClosed,
      isEventPast,
    } = req.body;

    if (!eventTitle || !eventdescription) {
      return next(new ApiError(status.BAD_REQUEST, "Title and description are required"));
    }

    // Improved validation for paid events
    if (eventType === "Paid") {
      if (!eventAmount || eventAmount === "0") {
        return next(new ApiError(status.BAD_REQUEST, "Amount is required for paid events"));
      }
      if (!paymentLink && !upi) {
        return next(new ApiError(status.BAD_REQUEST, "Either Payment link or UPI is required for paid events"));
      }
    }

    const info = {
      eventTitle,
      eventdescription,
      eventDate,
      eventType,
      eventAmount,
      receiverDetails: {
        upi: upi || null,
        paymentLink: paymentLink || null,
        // Store payment type preference
        preferredPaymentMethod: paymentLink ? 'link' : (upi ? 'upi' : null)
      },
      eventMaxReg,
      relatedEvent,
      participationType,
      maxTeamSize,
      minTeamSize,
      regDateAndTime,
      eventPriority,
      successMessage,
      isPublic: Boolean(isPublic) || false,
      isRegistrationClosed: Boolean(isRegistrationClosed) || false,
      isEventPast: Boolean(isEventPast) || false,
    };

    if (req.file) {
      try {
        const result = await uploadimage(req.file.path, "FormImages", FormImageHeight, FormImageWidth);
        info.eventImg = result ? result.secure_url : null;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return next(new ApiError(status.INTERNAL_SERVER_ERROR, "Error uploading image"));
      }
    }

    const newForm = await prisma.form.create({
      data: {
        info: info,
        sections: JSON.parse(req.body.sections || "[]"),
      },
    });

    res.status(status.OK).json({
      success: true,
      message: "Form created successfully",
      form: newForm,
    });
  } catch (error) {
    console.error("Error in creating form:", error);
    if (error.code === "P2002") {
      return next(
        new ApiError(
          status.INTERNAL_SERVER_ERROR,
          "Duplicate form ID. Form ID must be unique",
          error
        )
      );
    }
    return next(
      new ApiError(
        status.INTERNAL_SERVER_ERROR,
        "Error in creating form",
        error
      )
    );
  }
};

module.exports = { addForm };