const { PrismaClient, AccessTypes } = require("@prisma/client");
const moment = require("moment-timezone");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");
// const updateUser = require("../../utils/user/updateUser");
const { sendMail } = require("../../utils/email/nodeMailer");
const loadTemplate = require("../../utils/email/loadTemplate");
const uploadImage = require("../../utils/image/uploadImage");

const validateCurrentForm = expressAsyncHandler(
  async (form, user, userSubmittedSections) => {
    const { info, sections, formAnalytics } = form;

    const { eventMaxReg, isRegistrationClosed, isEventPast, isPublic } = info;

    if (isRegistrationClosed === "true" || isEventPast === "true") {
      throw new ApiError(
        400,
        "Sorry ! Registration has been closed for this event. If you feel this is an error, kindly contact us on fedkiit@gmail.com"
      );
    }

    if (!isPublic && req.user.access != AccessTypes.ADMIN) {
      throw new ApiError(
        401,
        "Registering to a private form is not allowed. If you feel this is an error, kindly contact us on fedkiit@gmail.com"
      );
    }

    console.log(formAnalytics[0]?.regUserEmails);
    console.log(user.regForm);
    const isAlreadyRegistered =
      formAnalytics[0]?.regUserEmails.includes(user.email) ||
      user.regForm.includes(form._id);
    if (isAlreadyRegistered) {
      throw new ApiError(
        400,
        "User has already registered for this form. If you feel this is an error, kindly contact us on fedkiit@gmail.com"
      );
    }
    console.log("Form analytics ", formAnalytics[0]);
    if (
      (formAnalytics[0]?.regUserEmails?.length ||
        formAnalytics[0]?.totalRegistrationCount ||
        0) >= (parseInt(eventMaxReg) || 1)
    ) {
      console.log(
        (formAnalytics[0]?.regUserEmails?.length ||
          formAnalytics[0]?.totalRegistrationCount) >=
          (parseInt(eventMaxReg) || 1)
      );
      console.log(eventMaxReg);
      console.log(parseInt(eventMaxReg));
      throw new ApiError(
        400,
        "Maximum registration limit reached. If you feel this is an error, kindly contact us on fedkiit@gmail.com"
      );
    }
  }
);

const addRegistration = expressAsyncHandler(async (req, res, next) => {
  console.log("Entering add", req.body);
  console.log("User Info", req.user);
  console.log(req.body);

  const { _id } = req.body;
  let sections = req.body.sections;
  sections = JSON.parse(sections);
  console.log("un-filtered sections", sections);

  // Filter out null values from sections
  sections = sections.filter((section) => section !== null);
  console.log("filtered sections", sections);

  if (!_id || !sections || !Array.isArray(sections)) {
    return next(new ApiError(400, "All fields are required"));
  }

  try {
    const form = await prisma.form.findUnique({
      where: { id: _id },
      include: { formAnalytics: true },
    });
    console.log("Form fetched from the database", form);

    if (!form) {
      return next(new ApiError(404, "Form not found"));
    }

    await validateCurrentForm(form, req.user, sections);
    console.log("form validation passed");

    const { info } = form;
    const { relatedEvent } = info;
    let teamName = [req.user.email.toUpperCase()];
    let teamCode = req.user.email;
    let relatedEventForm = null;
    let createTeamSection;
    let joinTeamSection;
    let teamExists;
    let formTrackerTeamNameList = [];

    if (relatedEvent && relatedEvent !== "null" && relatedEvent !== null) {
      relatedEventForm = await prisma.form.findUnique({
        where: { id: relatedEvent },
        include: { formAnalytics: true },
      });

      if (!relatedEventForm) {
        throw new ApiError(404, "Related Event not found");
      }

      // const userAlreadyRegisteredInRelatedForm = relatedEventForm.formAnalytics[0]?.regUserEmails?.includes(user.email);
      // console.log(req.user.regForm.includes(form.relatedEvent))
      // console.log("related event regUserEmails", relatedEventForm.formAnalytics[0]?.regUserEmails)

      const userAlreadyRegisteredInRelatedForm =
        req.user.regForm.includes(form.relatedEvent) ||
        relatedEventForm.formAnalytics[0]?.regUserEmails?.includes(
          req.user.email
        );

      if (!userAlreadyRegisteredInRelatedForm) {
        throw new ApiError(
          400,
          `User must be registered in the related event : ${relatedEventForm.info.eventTitle}`
        );
      }
      console.log("related event check passed");
    }

    let regTeamMemEmails = [];
    // console.log("Team Name :", teamName)
    // console.log("Team Code : ", teamCode)
    // console.log("setions : ", sections);

    const sectionsObject = {
      user_name: req.user.name,
      user_id: req.user.id,
      user_email: req.user.email,
      date_time: moment().tz("Asia/Kolkata").format(),
      amount: form?.info?.eventAmount || "0",
      sections: sections,
    };
    console.log("sections Object : ", sectionsObject);
 console.log(relatedEventForm);
    if (info.participationType !== "Individual") {
     
    
      teamCode = await generateTeamCode(
        relatedEventForm?.info.eventTitle,
        info.eventTitle,
        form.formAnalytics[0]?.regUserEmails.length
      );

      createTeamSection = sections.find(
        (section) => section.name === "Create Team"
      );
      joinTeamSection = !createTeamSection
        ? sections.find((section) => section.name === "Join Team")
        : null;

      if (createTeamSection) {
        const teamNameField = createTeamSection.fields.find(
          (field) => field.name === "Team Name"
        );
        if (teamNameField) {
          teamName = [teamNameField.value.toUpperCase().trim()];
          if (form.formAnalytics[0]?.regTeamNames.includes(teamName[0])) {
            return next(
              new ApiError(
                400,
                "! This team name already taken !\n Please choose a different one."
              )
            );
          }
          regTeamMemEmails.push(req.user.email);
        } else {
          return next(
            new ApiError(400, "Team Name field is required for Create Team")
          );
        }
      } else if (joinTeamSection) {
        const teamCodeField = joinTeamSection.fields.find(
          (field) => field.name === "Team Code"
        );

        if (teamCodeField) {
          teamExists = await prisma.formRegistration.findUnique({
            where: {
              formId_teamCode: {
                formId: _id,
                teamCode: teamCodeField.value,
              },
            },
          });

          if (!teamExists) {
            console.log("Team does not exist");
            return next(new ApiError(404, "Invalid team code"));
          }

          if (
            teamExists.regTeamMemEmails.length >=
            (parseInt(info.maxTeamSize) || 1)
          ) {
            console.log("team full");
            return next(new ApiError(400, "This team is full"));
          }

          // Log the teamExists object in a readable format
          console.log("team Exists", JSON.stringify(teamExists, null, 2));

          teamName = [teamExists.teamName];
          // console.log("team name array joining creating team", teamName)
          // teamName = [...new Set([...teamName, ...(form.formAnalytics?.length > 0 ? form.formAnalytics[0].regTeamNames : [])])];
          console.log("team name before ", teamName);
          console.log(
            "existing team names",
            form.formAnalytics?.length > 0
              ? form.formAnalytics[0].regTeamNames
              : []
          );

          // console.log("Team name array after joining team")

          teamCode = teamCodeField.value;
          regTeamMemEmails = [...teamExists.regTeamMemEmails, req.user.email];
        }

        // sections.user_id = req.user.id;
        // sections.user_email = req.user.email;
        // sections.user_name = req.user.name;

        // sectionsObject.push({ sections });
      }
    }

    formTrackerTeamNameList = [
      ...new Set([
        ...teamName,
        ...(form.formAnalytics?.length > 0
          ? form.formAnalytics[0].regTeamNames
          : []),
      ]),
    ];
    console.log("set data ", formTrackerTeamNameList);
    console.log("reg team members ", regTeamMemEmails);

    //const paymentSection = sections.find(section => section.name === "Payment Details");
    //const paymentSectionInActualForm = form.sections.find(section => section.name === "Payment Details")
    // if (paymentSectionInActualForm && paymentSection) {
    //     console.log("payment section is present in the form");
    //     if (req.files?.length > 0) {
    //         console.log("files", req.files);
    //         const imagePath = req.files[0].path;
    //         const result = await uploadImage(imagePath, req.files[0].fieldname || "PaymentScreenshot");
    //         console.log(result);
    //         sectionsObject.transactionScreenShot = result.secure_url;

    //         const paymentScreenshotField = paymentSection.fields.find(field => field.name === "Payment Screenshot" && field.type === "image");

    //         if (paymentScreenshotField) {
    //             // Update the value of the "Payment Screenshot" field with the secure URL
    //             paymentScreenshotField.value = result.secure_url;
    //             console.log("Payment Screenshot field updated successfully.");
    //         } else {
    //             console.error("Payment Screenshot field not found.");
    //         }

    //     }
    //     else {
    //         return next(new ApiError(400, "Kindly Attach Payment Screenshot"));
    //     }
    // } else if (paymentSectionInActualForm && !paymentSection) {
    //     return next(new ApiError(400, "Kindly fill the Payment section"));
    // }

    console.log(sectionsObject);

    const transaction = await prisma.$transaction(async (prisma) => {
      // Step 1 : ADD REGISTRATION
      const registration = await prisma.formRegistration.upsert({
        where: {
          formId_teamCode: {
            formId: _id,
            teamCode,
          },
        },
        update: {
          value: { push: sectionsObject },
          regTeamMemEmails: {
            set: regTeamMemEmails,
          },
          teamSize: {
            increment: 1,
          },
        },
        create: {
          formId: _id,
          userId: req.user.id,
          value: [sectionsObject],
          regTeamMemEmails: [req.user.email],
          teamSize: 1,
          teamCode,
          teamName: teamName[0],
        },
      });


      
      // const updatedUser = await updateUser({ email: req.user.email }, { regForm: _id });
      // console.log("related", relatedEventForm.info.eventTitle)
      // console.log("eventTitle", info.eventTitle)
      // console.log("count", form.formAnalytics[0]?.regUserEmails.length);
      teamCode = await generateTeamCode(
        relatedEventForm?.info.eventTitle,
        info.eventTitle,
        form.formAnalytics[0]?.regUserEmails.length
      );

      // Step 3 : UPDATE FORM ANALYTICS
      const updateFormRegistrationList =
        await prisma.registrationTracker.upsert({
          where: {
            formId: _id,
          },
          update: {
            regUserEmails: {
              push: req.user.email,
            },
            regTeamNames: { set: formTrackerTeamNameList },
            totalRegistrationCount: {
              increment: 1,
            },
          },
          create: {
            formId: _id,
            regUserEmails: [req.user.email],
            regTeamNames: { set: formTrackerTeamNameList },
            totalRegistrationCount: 1,
          },
        });

      return { registration,updateFormRegistrationList };
    });

    console.log(transaction.updatedUser);
    console.log("regTracker", transaction.updateFormRegistrationList);

    res.json({
      message: form.info.successMessage || "Registration successful",
      teamName: transaction.registration.teamName,
      teamCode: transaction.registration.teamCode,
      user: transaction.updatedUser,
    });
    // const placeholder = {
    //     name: req.user.email,
    //     successMessage: info.successMessage
    // }
    // const template = loadTemplate(
    //     (info.participationType === "Team") ? teamRegSuccess : indvRegSuccess,
    //     placeholder
    // )

    const subject = `Successfully registered on ${info.eventTitle}`;
    let template;
    const placeholders = {
      eventName: info.eventTitle ? info.eventTitle : "",
      teamName: transaction.registration.teamName
        ? transaction.registration.teamName
        : "",
      name: req.user.name ? req.user.name : "",
      teamCode: transaction.registration.teamCode
        ? transaction.registration.teamCode
        : "",
      successMessage: info.successMessage,
    };

    //take content form the team
    if (info.participationType === "Team") {
      template = loadTemplate("teamEventRegistrationSuccess", placeholders);
    } else {
      template = loadTemplate(
        "individualEventRegistrationSuccess",
        placeholders
      );
    }
    // const textContent = `Registration successfull in ${info.eventTitle}`;
    sendMail(req.user.email, subject, template);
  } catch (error) {
    console.error("Error during registration:", error);
    next(
      new ApiError(
        error.stausCode || 500,
        error.message || "Error during registration process",
        error
      )
    );
  }
});

const generateTeamCode = async (
  relatedFormName,
  currentFormName,
  existingTeamsCount = 0
) => {
  const relatedEventCode = relatedFormName?.slice(0, 2).toUpperCase();
  const currentFormCode = currentFormName?.slice(0, 2).toUpperCase();
  const teamCount = existingTeamsCount.toString().padStart(3, "0");
  const randomNum = Math.floor(1000 + Math.random() * 9000).toString();

  const teamCode = `${relatedEventCode ? relatedEventCode + "-" : ""}${
    currentFormCode ? currentFormCode + "-" : ""
  }${teamCount}-${randomNum}`;
  return teamCode;
};

module.exports = { addRegistration };