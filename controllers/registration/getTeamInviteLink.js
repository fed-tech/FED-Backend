const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Get shareable team invite link and team code (leader only)
//@route           GET /api/form/inviteLink/:formId
//@access          Private (USER)
const getTeamInviteLink = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId } = req.params;
        const { email, id: userId } = req.user;

        if (!formId) {
            return next(new ApiError(400, "Form ID is required"));
        }

        // Find the team registration
        const teamRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                regTeamMemEmails: { has: email }
            },
            include: {
                form: {
                    select: { info: true, id: true }
                }
            }
        });

        if (!teamRegistration) {
            return next(new ApiError(404, "No team registration found"));
        }

        // Verify requester is the leader
        if (teamRegistration.userId !== userId) {
            return next(new ApiError(403, "Only the team leader can generate invite links"));
        }

        // Build invite link — dynamically uses the request origin (localhost in dev, fedkiit.com in prod)
        const baseUrl = req.headers.origin || process.env.FRONTEND_URL || "https://fedkiit.com";
        const inviteLink = `${baseUrl}/Events/${teamRegistration.form.id}/Form?teamCode=${teamRegistration.teamCode}`;

        const shareText = `Join my team "${teamRegistration.teamName}" for ${teamRegistration.form.info.eventTitle || "an event"}!\n\nTeam Code: ${teamRegistration.teamCode}\nJoin here: ${inviteLink}`;

        res.status(200).json({
            success: true,
            data: {
                inviteLink,
                teamCode: teamRegistration.teamCode,
                teamName: teamRegistration.teamName,
                shareText
            }
        });

    } catch (error) {
        console.error("Error in getTeamInviteLink:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error generating invite link", error));
    }
});

module.exports = { getTeamInviteLink };
