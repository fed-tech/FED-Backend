const formatIST = (date) => {
  if (!date) return "";

  const d = new Date(date); // will parse ISO string but may shift to UTC internally

  const iso = date.toISOString
    ? date.toISOString()
    : new Date(date).toISOString();

  // Convert from the raw ISO string without letting JS adjust timezone
  // Extract manually from the original IST-stored date
  const [y, m, dayTime] = iso.split("-");
  const [day, time] = dayTime.split("T");
  const hhmm = time.substring(0, 5); // "HH:MM"

  return `${day}-${m}-${y} ${hhmm}`;
};

module.exports = formatIST;
