const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Search/browse available teams for a form (teamless users)
//@route           GET /api/form/searchTeams/:formId?search=<query>
//@access          Private (USER)
const searchTeams = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId } = req.params;
        const { search } = req.query;
        const { email } = req.user;

        if (!formId) {
            return next(new ApiError(400, "Form ID is required"));
        }

        // Get the form info to know maxTeamSize
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: { info: true }
        });

        if (!form) {
            return next(new ApiError(404, "Form not found"));
        }

        const maxTeamSize = parseInt(form.info.maxTeamSize) || 1;

        // Find all non-teamless registrations for this form that are not full
        const teamRegistrations = await prisma.formRegistration.findMany({
            where: {
                formId,
                teamName: { not: "UNAFFILIATED" },
                teamSize: { lt: maxTeamSize }
            },
            select: {
                id: true,
                teamName: true,
                teamSize: true,
                userId: true
            }
        });

        // Filter by search query if provided (case-insensitive substring match)
        let filteredTeams = teamRegistrations;
        if (search && search.trim()) {
            const searchLower = search.trim().toLowerCase();
            filteredTeams = teamRegistrations.filter(team =>
                team.teamName.toLowerCase().includes(searchLower)
            );
        }

        // Get leader names for each team
        const leaderIds = [...new Set(filteredTeams.map(t => t.userId))];
        const leaders = await prisma.user.findMany({
            where: { id: { in: leaderIds } },
            select: { id: true, name: true }
        });
        const leaderMap = {};
        leaders.forEach(l => { leaderMap[l.id] = l.name; });

        // Get pending join requests from this user for this form
        const pendingRequests = await prisma.teamJoinRequest.findMany({
            where: {
                formId,
                requesterEmail: email,
                status: "PENDING"
            },
            select: {
                teamRegistrationId: true
            }
        });
        const pendingTeamIds = new Set(pendingRequests.map(r => r.teamRegistrationId));

        // Build response
        const teams = filteredTeams.map(team => ({
            teamRegistrationId: team.id,
            teamName: team.teamName,
            teamSize: team.teamSize,
            maxTeamSize,
            leaderName: leaderMap[team.userId] || "Unknown",
            spotsRemaining: maxTeamSize - team.teamSize,
            hasPendingRequest: pendingTeamIds.has(team.id)
        }));

        res.status(200).json({
            success: true,
            data: { teams }
        });

    } catch (error) {
        console.error("Error in searchTeams:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error searching teams", error));
    }
});

module.exports = { searchTeams };
