const { addRegistration } = require("./addRegistration");
const { getRegistrationCount } = require("./countRegistration");
const { downloadRegistration } = require("./downloadRegistration");
const {
  getAttendanceCode,
  markAttendance,
  exportAttendance,
} = require("./markAttendance");

module.exports = {
  addRegistration,
  downloadRegistration,
  getRegistrationCount,
  getAttendanceCode,
  markAttendance,
  exportAttendance,
};
