const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Create a team (teamless user sets team name, becomes leader)
//@route           POST /api/form/createTeam
//@access          Private (USER)
const createTeam = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId, teamName } = req.body;
        const { email, id: userId } = req.user;

        if (!formId || !teamName) {
            return next(new ApiError(400, "Form ID and team name are required"));
        }

        const trimmedName = teamName.trim().toUpperCase();
        if (!trimmedName) {
            return next(new ApiError(400, "Team name cannot be empty"));
        }

        // Find user's teamless registration
        const userRegistration = await prisma.formRegistration.findFirst({
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

        if (!userRegistration) {
            return next(new ApiError(404, "You are not registered for this event. Please register first."));
        }

        // Verify user is currently teamless
        if (userRegistration.teamName !== "UNAFFILIATED") {
            return next(new ApiError(400, "You are already on a team. Leave your current team first."));
        }

        // Verify user is the owner of this registration (they should be, since it's their solo record)
        if (userRegistration.userId !== userId) {
            return next(new ApiError(403, "Registration mismatch"));
        }

        const { info } = userRegistration.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed. Team creation is no longer allowed."));
        }

        // Check if team name is already taken
        const tracker = await prisma.registrationTracker.findUnique({
            where: { formId }
        });

        if (tracker?.regTeamNames.includes(trimmedName)) {
            return next(new ApiError(400, "This team name is already taken. Please choose a different one."));
        }

        // Generate a proper team code
        const eventTitle = info.eventTitle || "EV";
        const eventCode = eventTitle.slice(0, 2).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
        const teamCount = (tracker?.regTeamNames?.length || 0).toString().padStart(3, '0');
        const newTeamCode = `${eventCode}-${teamCount}-${randomNum}`;

        // Transaction: update registration + update tracker
        const result = await prisma.$transaction(async (tx) => {
            // Update the user's solo registration to become a team
            const updatedReg = await tx.formRegistration.update({
                where: { id: userRegistration.id },
                data: {
                    teamName: trimmedName,
                    teamCode: newTeamCode
                }
            });

            // Add team name to registration tracker
            await tx.registrationTracker.update({
                where: { formId },
                data: {
                    regTeamNames: {
                        push: trimmedName
                    }
                }
            });

            return updatedReg;
        });

        res.status(200).json({
            success: true,
            message: `Team "${trimmedName}" created successfully!`,
            data: {
                teamName: result.teamName,
                teamCode: result.teamCode
            }
        });

    } catch (error) {
        console.error("Error in createTeam:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error creating team", error));
    }
});

module.exports = { createTeam };
