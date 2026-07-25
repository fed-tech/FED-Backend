const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { sendMail } = require("../../utils/email/nodeMailer");
const loadTemplate = require("../../utils/email/loadTemplate");

//@description     Handle Accept/Reject from email links (PUBLIC — no auth middleware)
//@route           GET /api/form/respondJoinRequest?token=<JWT>&action=accept|reject
//@access          Public (token-based authentication)
const respondJoinRequest = async (req, res) => {
    const { token, action } = req.query;
    const frontendBase = process.env.DOMAIN || "http://localhost:5173/";
    // Remove trailing slash for clean URL building
    const frontendUrl = frontendBase.endsWith('/') ? frontendBase.slice(0, -1) : frontendBase;

    // Helper to redirect to team page with toast
    const redirectToTeam = (formId, toastType, name) => {
        let url = `${frontendUrl}/Events/${formId}/team`;
        const params = [];
        if (toastType) params.push(`toast=${toastType}`);
        if (name) params.push(`name=${encodeURIComponent(name)}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return res.redirect(url);
    };

    // Helper to redirect with a generic error
    const redirectError = (message) => {
        return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(message)}`);
    };

    try {
        // Validate basic params
        if (!token || !action || !['accept', 'reject'].includes(action)) {
            return redirectError("Invalid request. Missing token or action.");
        }

        // Verify and decode JWT
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                // Try to decode without verification to get formId for redirect
                const payload = jwt.decode(token);
                if (payload?.formId) {
                    // Find form to get eventId
                    const form = await prisma.form.findUnique({
                        where: { id: payload.formId },
                        select: { info: true }
                    });
                    return redirectToTeam(payload.formId, "expired");
                }
                return redirectError("This request has expired.");
            }
            return redirectError("Invalid or tampered token.");
        }

        const { requestId, requesterEmail, teamRegistrationId, formId, leaderEmail } = decoded;

        // Find the join request
        const joinRequest = await prisma.teamJoinRequest.findUnique({
            where: { id: requestId }
        });

        if (!joinRequest) {
            return redirectError("Join request not found.");
        }

        // Find the form to get eventId for redirects
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: { info: true }
        });

        // Check if request is still PENDING
        if (joinRequest.status !== "PENDING") {
            const statusToasts = {
                "ACCEPTED": "already_accepted",
                "REJECTED": "already_rejected",
                "AUTO_EXPIRED": "already_joined",
                "EXPIRED": "expired"
            };
            return redirectToTeam(formId, statusToasts[joinRequest.status] || "invalid", joinRequest.requesterName);
        }

        // Check if request has passed its expiry time (even if JWT is valid)
        if (new Date() > new Date(joinRequest.expiresAt)) {
            await prisma.teamJoinRequest.update({
                where: { id: requestId },
                data: { status: "EXPIRED", respondedAt: new Date() }
            });
            return redirectToTeam(formId, "expired");
        }

        // === REJECT ===
        if (action === "reject") {
            await prisma.teamJoinRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED", respondedAt: new Date() }
            });

            // Send rejection email to requester
            try {
                const htmlContent = loadTemplate("teamJoinRejected", {
                    requesterName: joinRequest.requesterName || requesterEmail,
                    teamName: "", // We'll fill this below
                    eventName: form?.info?.eventTitle || "Event"
                });

                // Get team name for the email
                const targetTeam = await prisma.formRegistration.findUnique({
                    where: { id: teamRegistrationId },
                    select: { teamName: true }
                });

                const rejectionHtml = loadTemplate("teamJoinRejected", {
                    requesterName: joinRequest.requesterName || requesterEmail,
                    teamName: targetTeam?.teamName || "the team",
                    eventName: form?.info?.eventTitle || "Event"
                });

                await sendMail(
                    requesterEmail,
                    `Your join request for "${targetTeam?.teamName || "a team"}" was declined`,
                    rejectionHtml
                );
            } catch (emailError) {
                console.error("Error sending rejection email:", emailError);
                // Non-critical — continue with redirect
            }

            return redirectToTeam(formId, "rejected", joinRequest.requesterName);
        }

        // === ACCEPT ===
        // Check if user is still teamless
        const userRegistration = await prisma.formRegistration.findFirst({
            where: {
                formId,
                regTeamMemEmails: { has: requesterEmail }
            }
        });

        if (!userRegistration || userRegistration.teamName !== "UNAFFILIATED") {
            // User already joined another team
            await prisma.teamJoinRequest.update({
                where: { id: requestId },
                data: { status: "AUTO_EXPIRED", respondedAt: new Date() }
            });
            return redirectToTeam(formId, "already_joined", joinRequest.requesterName);
        }

        // Check the target team still exists and is not full
        const targetTeam = await prisma.formRegistration.findUnique({
            where: { id: teamRegistrationId },
            include: {
                form: { select: { info: true } }
            }
        });

        if (!targetTeam) {
            return redirectToTeam(formId, "invalid");
        }

        const maxSize = parseInt(targetTeam.form.info.maxTeamSize) || 1;
        if (targetTeam.teamSize >= maxSize) {
            await prisma.teamJoinRequest.update({
                where: { id: requestId },
                data: { status: "AUTO_EXPIRED", respondedAt: new Date() }
            });
            return redirectToTeam(formId, "team_full", joinRequest.requesterName);
        }

        // Get user's value[] entry from their solo record
        const userValue = userRegistration.value && userRegistration.value.length > 0
            ? userRegistration.value[0]
            : null;

        // Execute join in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Move user's data to the target team
            const updateData = {
                regTeamMemEmails: { push: requesterEmail },
                teamSize: { increment: 1 }
            };
            if (userValue) {
                updateData.value = { push: userValue };
            }

            await tx.formRegistration.update({
                where: { id: targetTeam.id },
                data: updateData
            });

            // 2. Delete user's solo registration
            await tx.formRegistration.delete({
                where: { id: userRegistration.id }
            });

            // 3. Mark THIS request as ACCEPTED
            await tx.teamJoinRequest.update({
                where: { id: requestId },
                data: { status: "ACCEPTED", respondedAt: new Date() }
            });

            // 4. Auto-expire ALL other PENDING requests from this user
            await tx.teamJoinRequest.updateMany({
                where: {
                    formId,
                    requesterEmail,
                    status: "PENDING",
                    id: { not: requestId }
                },
                data: { status: "AUTO_EXPIRED", respondedAt: new Date() }
            });
        });

        // Send confirmation email to requester
        try {
            const acceptHtml = loadTemplate("teamJoinAccepted", {
                requesterName: joinRequest.requesterName || requesterEmail,
                teamName: targetTeam.teamName,
                eventName: form?.info?.eventTitle || "Event"
            });

            await sendMail(
                requesterEmail,
                `🎉 You've joined team "${targetTeam.teamName}"!`,
                acceptHtml
            );
        } catch (emailError) {
            console.error("Error sending acceptance email:", emailError);
            // Non-critical — continue with redirect
        }

        return redirectToTeam(formId, "joined", joinRequest.requesterName);

    } catch (error) {
        console.error("Error in respondJoinRequest:", error);
        return redirectError("An unexpected error occurred. Please try again.");
    }
};

module.exports = { respondJoinRequest };
