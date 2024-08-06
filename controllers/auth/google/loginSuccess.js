const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const expressAsyncHandler = require('express-async-handler');
const prisma = new PrismaClient();

const loginSuccess = expressAsyncHandler(async(req, res) => {
    try{
        if(req.user){
            console.log(req.user);
            console.log(req.user._json);
            console.log(req.user.emails[0].value)
                
                const user = await prisma.user.findUnique({
                    where: { email: req.user.emails[0].value.toString() }
                });

                if (!user) {
                    const {given_name, family_name, email, picture, hd} = req.user._json;

                    let data = {
                        name : given_name+" "+ family_name,
                        email : email,
                        img : picture,
                    }
                    
                    if(hd === 'kiit.ac.in'){
                        data = {...data, school : "Kalinga Institute Of Industrial Teachnology", rollNumber : email.split('@')[0]};
                    }
                    
                    // take the google id as the paaword
                    data.password = req.user.id

                    console.log("data : ",data);

                    res.status(404).json({status: "User not found" ,data : data})

                    // const newUser = createUser(data,{},false)
                    // if(!newUser){
                    //     return next(new ApiError(500, "Unable to create user at this moment!"))
                    // }

                    // // frontend redirect url
                    // res.redirect("http://localhost:5000/api/auth/googleRegister")
                }
                else{
                    const token = jwt.sign({ id: user.id, email: user.email, loginTime: new Date().toISOString() }, process.env.JWT_SECRET, { expiresIn: '7h' });
                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: true,
                    });
                    console.log(token)
                    res.status(200).json("Logged in successfully!")
                }
            } else{
                res.status(403).json({error: true, message: "Not Authorized"})
            }
        }
    catch (error){
        res.json({error : error.message})
    }
});

module.exports = {loginSuccess};