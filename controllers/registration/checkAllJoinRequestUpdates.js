const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Get ALL unseen join request updates across all events for the current user
//@route           GET /api/form/allJoinRequestUpdates
//@access          Private (USER)
// Used globally on login/app mount to show rejection/acceptance toasts
const checkAllJoinRequestUpdates = expressAsyncHandler(async (req, res, next) => {
    try {
        const { email } = req.user;

        // Fetch all resolved requests that the requester hasn't seen yet
        const unseenUpdates = await prisma.teamJoinRequest.findMany({
            where: {
                requesterEmail: email,
                status: { not: "PENDING" },
                seenByRequester: false
            },
            select: {
                id: true,
                status: true,
                teamName: true,
                formId: true,
                respondedAt: true,
                createdAt: true
            },
            orderBy: { respondedAt: "desc" }
        });

        // Mark them as seen
        if (unseenUpdates.length > 0) {
            await prisma.teamJoinRequest.updateMany({
                where: {
                    id: { in: unseenUpdates.map(u => u.id) }
                },
                data: { seenByRequester: true }
            });
        }

        res.status(200).json({
            success: true,
            data: { updates: unseenUpdates }
        });

    } catch (error) {
        console.error("Error in checkAllJoinRequestUpdates:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error checking join request updates", error));
    }
});

module.exports = { checkAllJoinRequestUpdates };
