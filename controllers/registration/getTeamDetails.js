const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Get team details for a user in a specific form
//@route           GET /api/form/teamDetails/:formId
//@access          Private (requires authentication)
const getTeamDetails = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId } = req.params;
        const { email } = req.user;

        if (!formId) {
            return next(new ApiError(400, "Form ID is required"));
        }

        // Find the form registration where the user is a team member
        const teamRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId: formId,
                regTeamMemEmails: {
                    has: email
                }
            },
            include: {
                form: {
                    select: {
                        info: true
                    }
                }
            }
        });

        if (!teamRegistration) {
            return next(new ApiError(404, "No team registration found for this user in the specified form"));
        }

        const teamMembers = await prisma.user.findMany({
            where: {
                email: {
                    in: teamRegistration.regTeamMemEmails
                }
            },
            select: {
                name: true,
                email: true,
                img: true,
                rollNumber: true,
                college: true,
                year: true
            }
        });

        // Check if this is a team event
        const isTeamEvent = teamRegistration.form.info.participationType === "Team";

        if (!isTeamEvent) {
            return next(new ApiError(400, "This is not a team event"));
        }

        const teamDetails = {
            teamName: teamRegistration.teamName,
            teamCode: teamRegistration.teamCode,
            teamSize: teamRegistration.teamSize,
            maxTeamSize: teamRegistration.form.info.maxTeamSize || 1,
            members: teamMembers,
            eventTitle: teamRegistration.form.info.eventTitle
        };

        res.status(200).json({
            success: true,
            message: "Team details retrieved successfully",
            data: teamDetails
        });

    } catch (error) {
        console.error("Error fetching team details:", error);
        next(new ApiError(500, "Error fetching team details", error));
    }
});

module.exports = { getTeamDetails };
