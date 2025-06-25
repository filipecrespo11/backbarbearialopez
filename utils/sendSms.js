// Utilitário para envio de SMS usando Twilio
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendSms(to, code) {
  return client.messages.create({
    body: `Seu código de confirmação: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });
}

module.exports = sendSms;
