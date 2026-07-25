const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Leave team (self-removal) or dissolve team (leader only if sole member)
//@route           POST /api/form/leaveTeam
//@access          Private (USER)
// [v2] User becomes UNAFFILIATED instead of being deleted — no re-registration needed
const leaveTeam = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId } = req.body;
        const { email, id: userId } = req.user;

        if (!formId) {
            return next(new ApiError(400, "Form ID is required"));
        }

        // Find the team registration where the user is a member
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
            return next(new ApiError(404, "No team registration found for this user"));
        }

        // Can't leave if already UNAFFILIATED
        if (teamRegistration.teamName === "UNAFFILIATED") {
            return next(new ApiError(400, "You are not currently on a team."));
        }

        const { info } = teamRegistration.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed. Team changes are no longer allowed."));
        }

        const isLeader = teamRegistration.userId === userId;

        if (isLeader && teamRegistration.teamSize > 1) {
            return next(new ApiError(400, "You must remove all team members before leaving. As the leader, you cannot leave while other members are on the team."));
        }

        // Extract the user's form response data from the team record
        const userValue = teamRegistration.value?.filter(
            entry => entry.user_email === email
        ) || [];

        // Generate a unique solo team code
        const soloTeamCode = `SOLO-${userId}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Fetch registration tracker
        const tracker = await prisma.registrationTracker.findUnique({
            where: { formId }
        });

        if (!tracker) {
            return next(new ApiError(500, "Registration tracker not found"));
        }

        const oldTeamName = teamRegistration.teamName;

        await prisma.$transaction(async (tx) => {
            if (isLeader && teamRegistration.teamSize === 1) {
                // LEADER (sole member) — convert current record to UNAFFILIATED
                await tx.formRegistration.update({
                    where: { id: teamRegistration.id },
                    data: {
                        teamName: "UNAFFILIATED",
                        teamCode: soloTeamCode,
                    }
                });

                // Remove old team name from tracker (user stays in regUserEmails)
                const updatedTeamNames = tracker.regTeamNames.filter(
                    name => name !== oldTeamName
                );

                await tx.registrationTracker.update({
                    where: { formId },
                    data: {
                        regTeamNames: { set: updatedTeamNames }
                    }
                });
            } else {
                // REGULAR MEMBER — remove from team, create UNAFFILIATED solo record
                const updatedValue = teamRegistration.value.filter(
                    entry => entry.user_email !== email
                );
                const updatedEmails = teamRegistration.regTeamMemEmails.filter(
                    e => e !== email
                );

                // 1. Remove user from the team
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
                        userId,
                        teamName: "UNAFFILIATED",
                        teamCode: soloTeamCode,
                        teamSize: 1,
                        regTeamMemEmails: [email],
                        value: userValue
                    }
                });

                // Tracker stays the same — user is still registered, no count changes
            }
        });

        const action = isLeader ? "dissolved" : "left";
        res.status(200).json({
            success: true,
            message: `Successfully ${action} the team "${oldTeamName}". You can now create or join another team.`
        });

    } catch (error) {
        console.error("Error in leaveTeam:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error leaving team", error));
    }
});

module.exports = { leaveTeam };

