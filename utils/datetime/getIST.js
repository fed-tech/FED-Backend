function getISTDateTime(date = new Date()) {
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
}

module.exports = { getISTDateTime };
