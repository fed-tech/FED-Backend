const { addRegistration } = require("./addRegistration");
const { getRegistrationCount } = require("./countRegistration");
const { downloadRegistration } = require("./downloadRegistration");
const {
  getAttendanceCode,
  markAttendance,
  exportAttendance,
} = require("./markAttendance");
const { leaveTeam } = require("./leaveTeam");
const { inviteTeamMember } = require("./inviteTeamMember");
const { getTeamInviteLink } = require("./getTeamInviteLink");
const { renameTeam } = require("./renameTeam");
const { removeTeamMember } = require("./removeTeamMember");
// [v2] New team management controllers
const { createTeam } = require("./createTeam");
const { searchTeams } = require("./searchTeams");
const { joinTeam } = require("./joinTeam");
const { sendJoinRequest } = require("./sendJoinRequest");
const { respondJoinRequest } = require("./respondJoinRequest");
const { checkJoinRequestUpdates } = require("./checkJoinRequestUpdates");
const { checkAllJoinRequestUpdates } = require("./checkAllJoinRequestUpdates");

module.exports = {
  addRegistration,
  downloadRegistration,
  getRegistrationCount,
  getAttendanceCode,
  markAttendance,
  exportAttendance,
  leaveTeam,
  inviteTeamMember,
  getTeamInviteLink,
  renameTeam,
  removeTeamMember,
  // [v2] New team management exports
  createTeam,
  searchTeams,
  joinTeam,
  sendJoinRequest,
  respondJoinRequest,
  checkJoinRequestUpdates,
  checkAllJoinRequestUpdates,
};
