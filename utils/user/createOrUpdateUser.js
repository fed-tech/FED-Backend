const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const createUser = require('./createUser');
const updateUser = require('./updateUser');
const { ApiError } = require('../error/ApiError');

const createOrUpdateUser = async (key, data, sendMailFlag = false, file = null) => {
    console.log("Entering create or update user function");

    // Determine the key if not provided
    if (!key) {
        if (data.id) {
            key = { id: data.id };
        } else if (data.email) {
            key = { email: data.email };
        } else {
            throw new ApiError(400, "Key is required to update or check validity constraint");
        }
    }

    try {
        let user;
        let operation;

        try {
            // Attempt to update the user
            user = await updateUser(key, data);
            operation = 'updated';
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                // Record not found, create a new user
                user = await createUser(
                    { ...data, ...key },
                    sendMailFlag
                );
                operation = 'created';
            } else {
                // Rethrow other errors
                throw error;
            }
        }

        console.log(user, operation);
        return { user, operation };
    } catch (error) {
        console.error('Error in creating or updating user:', error);
        throw error;
    }
};

module.exports = createOrUpdateUser;
