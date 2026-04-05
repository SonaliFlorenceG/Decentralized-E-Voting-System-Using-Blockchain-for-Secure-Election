const express = require('express');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = new twilio(accountSid, authToken);
const otpStorage = new Map();

app.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    console.log(`Sending OTP to: ${phoneNumber}`);  // Debugging

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(phoneNumber, otp);
    console.log(`Generated OTP: ${otp}`); // Debugging

    try {
        const message = await client.messages.create({
            body: `Your OTP for voting: ${otp}`,
            from: twilioPhone,
            to: phoneNumber,
        });

        console.log(`Twilio Response:`, message); // Debugging
        res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
        console.error("Twilio Error:", error);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});


app.post('/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;
  res.json({ success: otpStorage.get(phoneNumber) === otp });
});
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.listen(5000, () => console.log('Server running on port 5000'));
console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN);
console.log("PHONE:", process.env.TWILIO_PHONE_NUMBER);