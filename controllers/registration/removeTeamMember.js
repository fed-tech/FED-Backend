const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");
const { sendMail } = require("../../utils/email/nodeMailer");
const loadTemplate = require("../../utils/email/loadTemplate");

//@description     Remove a team member (Leader only)
//@route           POST /api/form/removeTeamMember
//@access          Private (USER)
// [v2] Removed user becomes UNAFFILIATED instead of being deleted — no re-registration needed
const removeTeamMember = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId, memberEmail } = req.body;
        const { email, id: userId } = req.user;

        if (!formId || !memberEmail) {
            return next(new ApiError(400, "Form ID and member email are required"));
        }

        // Normalize email
        const normalizedEmail = memberEmail.trim().toLowerCase();

        // Find the team registration where the requesting user is the LEADER
        const teamRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                userId, // req.user.id must be the creator/leader
            },
            include: {
                form: {
                    select: { info: true }
                }
            }
        });

        if (!teamRegistration) {
            return next(new ApiError(404, "You are not the leader of any team for this form"));
        }

        const { info } = teamRegistration.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed. Team changes are no longer allowed."));
        }

        // Leader cannot remove themselves via this endpoint (use leaveTeam instead)
        if (memberEmail === email) {
            return next(new ApiError(400, "You cannot remove yourself. Use the Leave/Dissolve Team option."));
        }

        // Check if the member to be removed is actually in the team
        if (!teamRegistration.regTeamMemEmails.includes(memberEmail)) {
            return next(new ApiError(404, "The specified completed user is not in your team."));
        }

        // Extract the target user's form response data from the team record
        const userValue = teamRegistration.value?.filter(
            entry => entry.user_email === memberEmail
        ) || [];

        // Need to find the target user's ID for their new solo record
        const targetUser = await prisma.user.findUnique({
            where: { email: memberEmail },
            select: { id: true }
        });

        if (!targetUser) {
            return next(new ApiError(404, "Target user not found in the system."));
        }

        // Generate a unique solo team code for the removed member
        const soloTeamCode = `SOLO-${targetUser.id}-${Math.floor(1000 + Math.random() * 9000)}`;

        await prisma.$transaction(async (tx) => {
            // 1. Remove user from the team
            const updatedValue = teamRegistration.value.filter(
                entry => entry.user_email !== memberEmail
            );
            const updatedEmails = teamRegistration.regTeamMemEmails.filter(
                e => e !== memberEmail
            );

            await tx.formRegistration.update({
                where: { id: teamRegistration.id },
                data: {
                    value: { set: updatedValue },
                    regTeamMemEmails: { set: updatedEmails },
                    teamSize: { decrement: 1 }
                }
            });

            // 2. Create a new UNAFFILIATED solo record with user's form data
            await tx.formRegistration.create({
                data: {
                    formId,
                    userId: targetUser.id,
                    teamName: "UNAFFILIATED",
                    teamCode: soloTeamCode,
                    teamSize: 1,
                    regTeamMemEmails: [memberEmail],
                    value: userValue
                }
            });

            // Tracker stays the same — user is still registered, no count changes
        });

        // Send invitation email
        const htmlContent = loadTemplate("removedMember", {
            eventName: info.eventTitle || "Event",
            teamName: teamRegistration.teamName
        });

        await sendMail(
            normalizedEmail,
            `You're removed from "${teamRegistration.teamName}" from ${info.eventTitle || "an event"}`,
            htmlContent
        );

        res.status(200).json({
            success: true,
            message: `Successfully removed ${memberEmail} from the team & informed through ${normalizedEmail}`
        });

    } catch (error) {
        console.error("Error in removeTeamMember:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error removing team member", error));
    }
});

module.exports = { removeTeamMember };
