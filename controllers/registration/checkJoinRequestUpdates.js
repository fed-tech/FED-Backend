const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../../utils/error/ApiError");
const expressAsyncHandler = require("express-async-handler");

//@description     Get unseen join request updates (accepted/rejected/expired) for the current user
//@route           GET /api/form/joinRequestUpdates/:formId
//@access          Private (USER)
const checkJoinRequestUpdates = expressAsyncHandler(async (req, res, next) => {
    try {
        const { formId } = req.params;
        const { email } = req.user;

        if (!formId) {
            return next(new ApiError(400, "Form ID is required"));
        }

        // Fetch resolved requests that the requester hasn't seen yet
        const unseenUpdates = await prisma.teamJoinRequest.findMany({
            where: {
                formId,
                requesterEmail: email,
                status: { not: "PENDING" },
                seenByRequester: false
            },
            select: {
                id: true,
                status: true,
                teamName: true,
                respondedAt: true,
                createdAt: true
            },
            orderBy: { respondedAt: "desc" }
        });

        // Also return count of currently pending requests  
        const pendingCount = await prisma.teamJoinRequest.count({
            where: {
                formId,
                requesterEmail: email,
                status: "PENDING"
            }
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
            data: {
                updates: unseenUpdates,
                pendingCount
            }
        });

    } catch (error) {
        console.error("Error in checkJoinRequestUpdates:", error);
        if (error instanceof ApiError) throw error;
        next(new ApiError(500, "Error checking join request updates", error));
    }
});

module.exports = { checkJoinRequestUpdates };
