const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const expressAsyncHandler = require('express-async-handler');
const prisma = new PrismaClient();

const googleAuth = expressAsyncHandler(async(req, res) => {
    const {id, ...data} = req.body;
    const { email, name } = data;
    console.log(req.body)
    let user = await prisma.user.findUnique({
        where: { email }
    });
    if (user){
        if (user.password === id){
            const token = jwt.sign({ id: user.id, email: user.email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
            });
        }
        else{
            res.send("403 Unauthorized Error")
        }
    }
    else{
        
        const id = await bcrypt.hash(id, 10);
        data.password = id;
        data.access = AccessTypes.USER;
        const newUser = await createUser(data, sendMailFlag);
        const token = jwt.sign({ id: newUser.id, email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
        // Send the token as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true
        });

        // Delete the password before sending the new created user data 
        delete newUser.password;

        // Respond to the client immediately
        res.status(201).json({ message: 'User created successfully', user : newUser, token: token });
    }
})

module.exports = { googleAuth };