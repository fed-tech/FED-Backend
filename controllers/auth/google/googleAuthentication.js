// const jwt = require('jsonwebtoken');
// const { PrismaClient } = require('@prisma/client');
// const expressAsyncHandler = require('express-async-handler');
// const bcrypt = require('bcryptjs');
// const prisma = new PrismaClient();

// const googleAuth = expressAsyncHandler(async(req, res) => {
//     const {id, ...data} = req.body;
//     const { email, name } = data;
//     console.log(req.body)
//     let user = await prisma.user.findUnique({
//         where: { email }
//     });
//     if (user){
//         const isPasswordValid = await bcrypt.compare(req.body.id, req.user.password);
//         if (!isPasswordValid) {
//             return next(new ApiError(401, 'Invalid password'));
//         }
//         const token = jwt.sign({ id: user.id, email: user.email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: true,
//         });
//     }
//     else{
//         const id = await bcrypt.hash(id, 10);
//         data.password = id;
//         data.access = AccessTypes.USER;
//         const newUser = await createUser(data, sendMailFlag);
//         const token = jwt.sign({ id: newUser.id, email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: true
//         });
//         delete newUser.password;
//         res.status(201).json({ message: 'User created successfully', user : newUser, token: token });
//     }
// })

// module.exports = { googleAuth };






const jwt = require('jsonwebtoken');
const { PrismaClient, AccessTypes } = require('@prisma/client');
const expressAsyncHandler = require('express-async-handler');
const { ApiError } = require('../../../utils/error/ApiError');
const createUser = require('../../../utils/user/createUser');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const sendMailFlag = false;

const googleAuth = expressAsyncHandler(async(req, res, next) => {
    const { id: rawId, ...data } = req.body; // Rename 'id' to 'rawId' to avoid conflicts
    const { email, name } = data;
    console.log(req.body);
    
    let user = await prisma.user.findUnique({
        where: { email }
    });
    
    if (user) {
        const isPasswordValid = await bcrypt.compare(rawId, user.password);
        if (!isPasswordValid) {
            return next(new ApiError(401, 'Invalid password'));
        }
        const token = jwt.sign({ id: user.id, email: user.email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
        });
        res.status(200).json({ message: 'User logged in successfully', token });
    } else {
        const hashedId = await bcrypt.hash(rawId, 10); // Hash the raw ID value
        data.password = hashedId;
        data.access = AccessTypes.USER;
        
        const newUser = await createUser(data, sendMailFlag);
        const token = jwt.sign({ id: newUser.id, email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true
        });
        
        delete newUser.password;
        res.status(201).json({ message: 'User created successfully', user: newUser, token });
    }
});

module.exports = { googleAuth };