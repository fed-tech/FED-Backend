const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");
const { sendMail } = require("../../utils/email/nodeMailer");
const loadTemplate = require("../../utils/email/loadTemplate");

//@description     Send email invitation to join team (leader only)
//@route           POST /api/form/inviteTeamMember
//@access          Private (USER)
const inviteTeamMember = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId, inviteeEmail } = req.body;
        const { email, id: userId, name: inviterName } = req.user;

        if (!formId || !inviteeEmail) {
            return next(new ApiError(400, "Form ID and invitee email are required"));
        }

        // Normalize email
        const normalizedEmail = inviteeEmail.trim().toLowerCase();

        if (normalizedEmail === email) {
            return next(new ApiError(400, "You cannot invite yourself"));
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
            return next(new ApiError(403, "Only the team leader can invite members"));
        }

        const { info } = teamRegistration.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed. Invitations are no longer allowed."));
        }

        // Check if team is full
        const maxSize = parseInt(info.maxTeamSize) || 1;
        if (teamRegistration.teamSize >= maxSize) {
            return next(new ApiError(400, `Team is full (${teamRegistration.teamSize}/${maxSize} members).`));
        }

        // Check if invitee is already a member of this team
        if (teamRegistration.regTeamMemEmails.includes(normalizedEmail)) {
            return next(new ApiError(400, "This person is already on your team"));
        }

        // Check if invitee is already registered for this form (on another team)
        // [v2] UNAFFILIATED users CAN be invited — they need a team
        const inviteeRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                regTeamMemEmails: { has: normalizedEmail }
            }
        });
        if (inviteeRegistration && inviteeRegistration.teamName !== "UNAFFILIATED") {
            return next(new ApiError(400, "This person is already on another team for this event"));
        }

        // Build invite link — dynamically uses the request origin (localhost in dev, fedkiit.com in prod)
        const baseUrl = req.headers.origin || process.env.FRONTEND_URL || "https://fedkiit.com";
        const inviteLink = `${baseUrl}/Events/${teamRegistration.form.id}/Form?teamCode=${teamRegistration.teamCode}`;

        // Send invitation email
        const htmlContent = loadTemplate("teamInvitation", {
            eventName: info.eventTitle || "Event",
            teamName: teamRegistration.teamName,
            teamCode: teamRegistration.teamCode,
            inviterName: inviterName || "Your teammate",
            inviteLink: inviteLink
        });

        await sendMail(
            normalizedEmail,
            `You're invited to join team "${teamRegistration.teamName}" for ${info.eventTitle || "an event"}`,
            htmlContent
        );

        res.status(200).json({
            success: true,
            message: `Invitation sent to ${normalizedEmail}`
        });

    } catch (error) {
        console.error("Error in inviteTeamMember:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error sending invitation", error));
    }
});

module.exports = { inviteTeamMember };
