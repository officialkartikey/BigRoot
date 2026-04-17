// utils/otpStore.js
const otpStore = new Map();

/*
Structure:
{
  email: {
    otp: "123456",
    expiresAt: 123456789,
    lastSentAt: 123456789
  }
}
*/

module.exports = otpStore;