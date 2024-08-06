const XLSX = require('xlsx');
const fs = require('fs');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const createOrUpdateUser = require('../../../utils/user/createOrUpdateUser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//@description     Upload and read Excel file
//@route           POST /api/upload
//@access          Public
const addMembersThroughExcel = expressAsyncHandler(async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new ApiError(400, 'No file uploaded'));
        }

        const filePath = req.file.path;
        console.log("incoming file path",filePath);
        const workbook = XLSX.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);

        console.log("Uploaded file data:", data);

        const results = [];

        for (const entry of data) {
            if (!entry.EMAIL || !entry.ACCESS) {
                results.push({ status: 'error', message: 'Email and access are required for each entry', entry: entry });
                continue;
            }

            const userData = {};

            // Dynamically map each field from Excel data to userData
            Object.keys(entry).forEach(key => {
                const formattedKey = key.toLowerCase(); // Convert key to lower case to match model field names
                if (formattedKey === 'email') {
                    userData.email = entry[key];
                } else if (formattedKey === 'access') {
                    userData.access = entry[key].trim().toUpperCase().replace(/\s+/g, '_'); // Trim and format access value
                } else if (formattedKey === 'extra') {
                    try {
                        const sanitizedExtra = entry[key].replace(/[‘’]/g, '"').replace(/[“”]/g, '"');
                        userData.extra = JSON.parse(sanitizedExtra);
                    } catch (parseError) {
                        console.error('Error parsing extra field JSON:', entry[key]);
                        results.push({ status: 'error', message: 'Invalid JSON in extra field', entry: entry });
                        return;
                    }
                } else {
                    userData[formattedKey] = entry[key];
                }
            });

            try {
                const updatedUser = await createOrUpdateUser({ email: userData.email }, userData);
                delete updatedUser.user.password; // Delete password from updatedUser object
                results.push({ status: 'success', user: updatedUser });
            } catch (error) {
                console.error('Error updating user:', error);
                results.push({ status: 'error', message: error.message, entry: entry });
            }
        }

        console.log("File path before delete ", filePath);

        // Unlink (delete) the file after processing
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            } else {
                console.log('File deleted successfully:', filePath);
            }
        });

        res.status(200).json({ message: 'File processed successfully', results: results });
    } catch (error) {
        console.error('Error processing file:', error);
        next(new ApiError(500, 'Error processing file', error));
    }
});

module.exports = { addMembersThroughExcel };
