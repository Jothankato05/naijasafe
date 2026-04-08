const activeUsers = [];

function enterArea(phone, location) {
  const existing = activeUsers.find(u => u.phone === phone);

  if (existing) {
    existing.location = location.toLowerCase();
  } else {
    activeUsers.push({
      phone,
      location: location.toLowerCase()
    });
  }

  console.log(`${phone} is now active in ${location}`);
}

function leaveArea(phone) {
  const index = activeUsers.findIndex(u => u.phone === phone);
  if (index !== -1) {
    activeUsers.splice(index, 1);
  }
}

function getUsersInLocation(location) {
  return activeUsers.filter(u =>
    u.location.includes(location.toLowerCase())
  );
}

module.exports = { enterArea, leaveArea, getUsersInLocation };
