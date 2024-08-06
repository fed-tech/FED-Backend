const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../error/ApiError');

const updateUser = async (key, data) => {
    console.log("Updating existing user", key, data);

    let newFormIds = null;

    // Build the update data object
    let updateData = {
        ...data
    };

    if (data.regForm) {
        newFormIds = data.regForm;
        delete data.regForm;
        updateData = {
            ...updateData,
            regForm: {
                push: newFormIds
            }
        };
    }

    // Update the user
    const user = await prisma.user.update({
        where: key,
        data: updateData
    });

    console.log(`Updated user with ${JSON.stringify(key)} successfully!`);
    return user;
};

module.exports = updateUser;
