// controllers/form/analytics.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ApiError } = require('../../utils/error/ApiError');

//@description     Form analytics
//@route           get /api/form/formAnalytics/:id
//@access          ADMIN

const formAnalytics = async((res,req)=>{
    const {formId} = req.body;


})

const addClickCount = async (req,res,next)=> {
    const {formId} = req.body;

    await prisma.model.update({
  where: { id: 'some-id' },
  data: { value: { increment: 1 } }
})
}
    
