const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../../utils/email/nodeMailer");
const loadTemplate = require("../../utils/email/loadTemplate");

//@description     Send join request to team leader — creates DB record, signs JWT, sends email
//@route           POST /api/form/sendJoinRequest
//@access          Private (USER)
const sendJoinRequest = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId, teamRegistrationId } = req.body;
        const { email, name } = req.user;

        if (!formId || !teamRegistrationId) {
            return next(new ApiError(400, "Form ID and team registration ID are required"));
        }

        // Verify user is registered and teamless
        const userRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                regTeamMemEmails: { has: email }
            }
        });

        if (!userRegistration) {
            return next(new ApiError(404, "You are not registered for this event."));
        }

        if (userRegistration.teamName !== "UNAFFILIATED") {
            return next(new ApiError(400, "You are already on a team."));
        }

        // Find the target team
        const targetTeam = await prisma.formRegistration.findUnique({
            where: { id: teamRegistrationId },
            include: {
                form: {
                    select: { info: true, id: true }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!targetTeam) {
            return next(new ApiError(404, "Team not found"));
        }

        if (targetTeam.formId !== formId) {
            return next(new ApiError(400, "Team does not belong to this form"));
        }

        if (targetTeam.teamName === "UNAFFILIATED") {
            return next(new ApiError(400, "Cannot request to join a teamless registration"));
        }

        const { info } = targetTeam.form;

        // Check if registration is still open
        if (info.isRegistrationClosed === 'true' || info.isEventPast === 'true') {
            return next(new ApiError(400, "Registration is closed."));
        }

        // Check if team is full
        const maxSize = parseInt(info.maxTeamSize) || 1;
        if (targetTeam.teamSize >= maxSize) {
            return next(new ApiError(400, `Team is full (${targetTeam.teamSize}/${maxSize} members).`));
        }

        // Limit: max 3 pending requests at a time per user per event
        const pendingCount = await prisma.teamJoinRequest.count({
            where: {
                formId,
                requesterEmail: email,
                status: "PENDING"
            }
        });

        if (pendingCount >= 3) {
            return next(new ApiError(400, "You already have 3 pending requests. Wait for a response before sending more."));
        }

        // Check no existing PENDING request from this user to this team
        const existingRequest = await prisma.teamJoinRequest.findFirst({
            where: {
                formId,
                requesterEmail: email,
                teamRegistrationId,
                status: "PENDING"
            }
        });

        if (existingRequest) {
            return next(new ApiError(400, "You already have a pending request for this team."));
        }

        const leaderEmail = targetTeam.user.email;
        const leaderName = targetTeam.user.name;
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        // Create join request record
        const joinRequest = await prisma.teamJoinRequest.create({
            data: {
                formId,
                requesterEmail: email,
                requesterName: name || email,
                teamRegistrationId,
                teamName: targetTeam.teamName,
                leaderEmail,
                status: "PENDING",
                expiresAt
            }
        });

        // Sign JWT token with request details (48h expiry)
        const token = jwt.sign(
            {
                requestId: joinRequest.id,
                requesterEmail: email,
                teamRegistrationId,
                formId,
                leaderEmail
            },
            process.env.JWT_SECRET,
            { expiresIn: '48h' }
        );

        // Build Accept/Reject URLs
        const baseUrl = req.headers.origin || process.env.FRONTEND_URL || "https://fedkiit.com";
        // These point to backend endpoints that will process the action and redirect to frontend
        const backendBase = `${req.protocol}://${req.get('host')}`;
        const acceptUrl = `${backendBase}/api/form/respondJoinRequest?token=${token}&action=accept`;
        const rejectUrl = `${backendBase}/api/form/respondJoinRequest?token=${token}&action=reject`;

        // Send email to leader
        const htmlContent = loadTemplate("teamJoinRequest", {
            leaderName: leaderName || "Team Leader",
            requesterName: name || email,
            requesterEmail: email,
            teamName: targetTeam.teamName,
            eventName: info.eventTitle || "Event",
            teamSize: targetTeam.teamSize.toString(),
            maxTeamSize: maxSize.toString(),
            acceptUrl,
            rejectUrl,
            expiryHours: "48"
        });

        await sendMail(
            leaderEmail,
            `Join Request: ${name || email} wants to join your team "${targetTeam.teamName}"`,
            htmlContent
        );

        res.status(200).json({
            success: true,
            message: `Join request sent to the team leader. They will receive an email with your request.`,
            data: {
                requestId: joinRequest.id
            }
        });

    } catch (error) {
        console.error("Error in sendJoinRequest:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error sending join request", error));
    }
});

module.exports = { sendJoinRequest };
