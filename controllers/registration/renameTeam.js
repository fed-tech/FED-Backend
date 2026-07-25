const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Rename team (leader only)
//@route           PATCH /api/form/renameTeam
//@access          Private (USER)
const renameTeam = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId, newTeamName } = req.body;
        const { email, id: userId } = req.user;

        if (!formId || !newTeamName) {
            return next(new ApiError(400, "Form ID and new team name are required"));
        }

        const trimmedName = newTeamName.toUpperCase().trim();

        if (!trimmedName) {
            return next(new ApiError(400, "Team name cannot be empty"));
        }

        // Find the team registration
        const teamRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                regTeamMemEmails: { has: email }
            },
            include: {
                form: {
                    select: { info: true }
                }
            }
        });

        if (!teamRegistration) {
            return next(new ApiError(404, "No team registration found"));
        }

        // Verify requester is the leader
        if (teamRegistration.userId !== userId) {
            return next(new ApiError(403, "Only the team leader can rename the team"));
        }

        const { info } = teamRegistration.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed. Team changes are no longer allowed."));
        }

        // If the name hasn't changed, no-op
        if (trimmedName === teamRegistration.teamName) {
            return res.status(200).json({
                success: true,
                message: "Team name unchanged",
                data: { teamName: trimmedName }
            });
        }

        // Check for duplicate team name via registrationTracker
        const tracker = await prisma.registrationTracker.findUnique({
            where: { formId }
        });

        if (tracker?.regTeamNames.includes(trimmedName)) {
            return next(new ApiError(400, "This team name is already taken. Please choose a different one."));
        }

        await prisma.$transaction(async (tx) => {
            // Update formRegistration teamName
            await tx.formRegistration.update({
                where: { id: teamRegistration.id },
                data: { teamName: trimmedName }
            });

            // Update registrationTracker: swap old name with new name
            if (tracker) {
                const updatedNames = tracker.regTeamNames.map(
                    name => name === teamRegistration.teamName ? trimmedName : name
                );

                await tx.registrationTracker.update({
                    where: { formId },
                    data: {
                        regTeamNames: { set: updatedNames }
                    }
                });
            }
        });

        res.status(200).json({
            success: true,
            message: `Team renamed to "${trimmedName}"`,
            data: { teamName: trimmedName }
        });

    } catch (error) {
        console.error("Error in renameTeam:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error renaming team", error));
    }
});

module.exports = { renameTeam };
