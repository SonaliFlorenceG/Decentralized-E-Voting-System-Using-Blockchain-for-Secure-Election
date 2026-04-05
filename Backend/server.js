// const express = require('express');
// const twilio = require('twilio');
// const cors = require('cors');

// const app = express();
// app.use(express.json());
// app.use(cors());

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
// const client = new twilio(accountSid, authToken);
// const otpStorage = new Map();

// app.post('/send-otp', async (req, res) => {
//     const { phoneNumber } = req.body;
//     console.log(`Sending OTP to: ${phoneNumber}`);  // Debugging

//     if (!phoneNumber) {
//         return res.status(400).json({ success: false, message: "Phone number is required" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     otpStorage.set(phoneNumber, otp);
//     console.log(`Generated OTP: ${otp}`); // Debugging

//     try {
//         const message = await client.messages.create({
//             body: `Your OTP for voting: ${otp}`,
//             from: twilioPhone,
//             to: phoneNumber,
//         });

//         console.log(`Twilio Response:`, message); // Debugging
//         res.json({ success: true, message: "OTP sent successfully!" });
//     } catch (error) {
//         console.error("Twilio Error:", error);
//         res.status(500).json({ success: false, message: "Failed to send OTP" });
//     }
// });


// app.post('/verify-otp', (req, res) => {
//   const { phoneNumber, otp } = req.body;
//   res.json({ success: otpStorage.get(phoneNumber) === otp });
// });
// app.get("/", (req, res) => {
//   res.send("Backend is running 🚀");
// });
// app.listen(5000, () => console.log('Server running on port 5000'));
// console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
// console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN);
// console.log("PHONE:", process.env.TWILIO_PHONE_NUMBER);





const express = require('express');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Load env variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// ✅ Debug env (safe for now, remove later)
console.log("SID:", accountSid);
console.log("TOKEN:", authToken ? "Loaded ✅" : "Missing ❌");
console.log("PHONE:", twilioPhone);

// ✅ Initialize Twilio client
const client = twilio(accountSid, authToken);

// ✅ Temporary OTP storage
const otpStorage = new Map();

// ================= SEND OTP =================
app.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    console.log("Incoming request body:", req.body);
    console.log(`Sending OTP to: ${phoneNumber}`);

    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required"
        });
    }

    // ✅ Ensure correct format (force +91 if missing)
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
        formattedPhone = `+91${phoneNumber}`;
    }

    console.log("Formatted phone:", formattedPhone);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(formattedPhone, otp);

    console.log(`Generated OTP: ${otp}`);

    try {
        const message = await client.messages.create({
            body: `Your OTP for voting: ${otp}`,
            from: twilioPhone,
            to: formattedPhone,
        });

        console.log("✅ SMS SENT:", message.sid);

        res.json({
            success: true,
            message: "OTP sent successfully!"
        });

    } catch (error) {
        console.error("===== TWILIO ERROR DEBUG =====");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Status:", error.status);
        console.error("More Info:", error.moreInfo);
        console.error("Full Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================= VERIFY OTP =================
app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;

    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
        formattedPhone = `+91${phoneNumber}`;
    }

    const storedOtp = otpStorage.get(formattedPhone);

    console.log("Verifying OTP:", {
        phone: formattedPhone,
        entered: otp,
        stored: storedOtp
    });

    if (storedOtp === otp) {
        otpStorage.delete(formattedPhone);
        return res.json({ success: true });
    }

    res.json({ success: false });
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

// ================= START SERVER =================
app.listen(5000, () => console.log('Server running on port 5000'));