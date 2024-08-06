// controllers/form/formController.js
const { addMember } = require('./member/addMember');
const { addMembersThroughExcel } = require('./member/addMembersThroughExcel');
const { deleteMember } = require('./member/deleteMember');
const { editProfile }= require('./member/editProfile');
const { fetchAccessTypes } = require('./member/fetchAccessTypes');
const { deleteUser } = require('./user/deleteUser');
const { fetchAlumni } = require('./user/getAlumni');
const { fetchTeam } = require('./user/getTeam');
const { fetchUser } = require('./user/getUser');

module.exports = {
    addMember,
    fetchUser,
    fetchTeam,
    editProfile,
    deleteMember,
    deleteUser,
    fetchAccessTypes,
    fetchAlumni,
    addMembersThroughExcel
};