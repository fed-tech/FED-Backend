const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Join team — used by invite links AND accepted requests. Auto-expires other pending requests.
//@route           POST /api/form/joinTeam
//@access          Private (USER)
const joinTeam = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId, teamCode } = req.body;
        const { email, id: userId } = req.user;

        if (!formId || !teamCode) {
            return next(new ApiError(400, "Form ID and team code are required"));
        }

        // Find user's solo (teamless) registration
        const userRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                regTeamMemEmails: { has: email }
            }
        });

        if (!userRegistration) {
            return next(new ApiError(404, "You are not registered for this event. Please register first."));
        }

        // Verify user is currently teamless
        if (userRegistration.teamName !== "UNAFFILIATED") {
            return next(new ApiError(400, "You are already on a team. Leave your current team first."));
        }

        // Find the target team
        const targetTeam = await prisma.formRegistration.findUnique({
            where: {
                formId_teamCode: {
                    formId,
                    teamCode
                }
            },
            include: {
                form: {
                    select: { info: true }
                }
            }
        });

        if (!targetTeam) {
            return next(new ApiError(404, "Team not found. The team code may be invalid."));
        }

        if (targetTeam.teamName === "UNAFFILIATED") {
            return next(new ApiError(400, "Cannot join a teamless registration"));
        }

        const { info } = targetTeam.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed. Team changes are no longer allowed."));
        }

        // Check if team is full
        const maxSize = parseInt(info.maxTeamSize) || 1;
        if (targetTeam.teamSize >= maxSize) {
            return next(new ApiError(400, `Team is full (${targetTeam.teamSize}/${maxSize} members).`));
        }

        // Get user's value[] entry from their solo record
        const userValue = userRegistration.value && userRegistration.value.length > 0
            ? userRegistration.value[0]
            : null;

        await prisma.$transaction(async (tx) => {
            // 1. Move user's data to the target team record
            const updateData = {
                regTeamMemEmails: {
                    push: email
                },
                teamSize: {
                    increment: 1
                }
            };

            // Push user's value entry if it exists
            if (userValue) {
                updateData.value = {
                    push: userValue
                };
            }

            await tx.formRegistration.update({
                where: { id: targetTeam.id },
                data: updateData
            });

            // 2. Delete user's solo registration record
            await tx.formRegistration.delete({
                where: { id: userRegistration.id }
            });

            // 3. Auto-expire all PENDING join requests from this user for this form
            await tx.teamJoinRequest.updateMany({
                where: {
                    formId,
                    requesterEmail: email,
                    status: "PENDING"
                },
                data: {
                    status: "AUTO_EXPIRED",
                    respondedAt: new Date()
                }
            });
        });

        res.status(200).json({
            success: true,
            message: `Successfully joined team "${targetTeam.teamName}"!`,
            data: {
                teamName: targetTeam.teamName,
                teamCode: targetTeam.teamCode,
                eventId: (info.relatedEvent && info.relatedEvent !== "null") ? info.relatedEvent : formId
            }
        });

    } catch (error) {
        console.error("Error in joinTeam:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error joining team", error));
    }
});

module.exports = { joinTeam };
