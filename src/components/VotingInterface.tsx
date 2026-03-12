import React, { useState, useEffect, Fragment } from "react";
import { Vote, CheckCircle2 } from "lucide-react";
import { Candidate } from "../types";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";

interface VotingInterfaceProps {
  candidates: Candidate[];
  isActive: () => Promise<boolean>;
  hasVoted: boolean;
  onVote: (candidateId: number) => Promise<void>;
  resultsPublished: () => Promise<boolean>;
  voterName?: string;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  candidates,
  isActive,
  hasVoted,
  onVote,
  resultsPublished,
  voterName,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isActiveState, setIsActiveState] = useState<boolean>(false);
  const [isResultsPublished, setIsResultsPublished] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isOtpLoading, setIsOtpLoading] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const status = await isActive();
        setIsActiveState(status);

        const published = await resultsPublished();
        setIsResultsPublished(published);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch voting status or results publication status.");
      }
    };

    fetchData();
  }, [isActive, resultsPublished]);

  const sendOtp = async () => {
    // Validation: Check if phone number is empty
    if (!phoneNumber || phoneNumber.trim() === "") {
      toast.error("Please enter a valid phone number.");
      return;
    }

    // Clean phone number: remove all non-digits
    let cleanedPhone = phoneNumber.replace(/\D/g, "");
    
    // Remove +91 if user entered it
    if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    
    // Validation: Check phone number format (10 digits for Indian numbers)
    const phoneRegex = /^[0-9]{10}$/;
    
    if (!phoneRegex.test(cleanedPhone)) {
      toast.error("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    // Format phone number with +91 for Twilio
    const formattedPhone = `+91${cleanedPhone}`;

    setIsOtpLoading(true);
    // Show loading toast immediately when Send OTP is clicked
    const loadingToast = toast.loading("Sending OTP...");
    
    try {
      const response = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await response.json();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (data.success) {
        setIsOtpSent(true);
        setPhoneNumber(cleanedPhone); // Store cleaned 10-digit number for display
        toast.success("OTP sent successfully! Please check your phone.");
      } else {
        toast.error(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.dismiss(loadingToast);
      toast.error("Network error. Please check your connection and try again.");
    }
    setIsOtpLoading(false);
  };

  const verifyOtp = async () => {
    // Validation: Check if OTP is empty
    if (!otp || otp.trim() === "") {
      toast.error("Please enter the OTP.");
      return;
    }

    // Validation: Check OTP format (should be numeric, typically 4-6 digits)
    const otpRegex = /^[0-9]{4,6}$/;
    const cleanedOtp = otp.replace(/\D/g, ""); // Remove non-digits
    
    if (!otpRegex.test(cleanedOtp)) {
      toast.error("Please enter a valid OTP (4-6 digits).");
      return;
    }

    // Validation: Check if phone number is available
    if (!phoneNumber || !isOtpSent) {
      toast.error("Please send OTP first.");
      return;
    }

    // Format phone number with +91 for Twilio verification
    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    let formattedPhone = cleanedPhone;
    
    // Ensure it's 10 digits and add +91
    if (cleanedPhone.length === 10) {
      formattedPhone = `+91${cleanedPhone}`;
    } else if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
      formattedPhone = `+${cleanedPhone}`;
    } else {
      toast.error("Invalid phone number format.");
      return;
    }

    setIsVerifyingOtp(true);
    // Show loading toast immediately when Verify OTP is clicked
    const loadingToast = toast.loading("Verifying OTP...");
    
    try {
      const response = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formattedPhone, otp: cleanedOtp }),
      });

      const data = await response.json();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (data.success) {
        toast.success("OTP verified successfully! Submitting your vote...");
        setIsOtpModalOpen(false);
        // Reset OTP fields
        setOtp("");
        setIsOtpSent(false);
        await handleVoteSubmission();
      } else {
        toast.error(data.message || "Invalid OTP. Please check and try again.");
        // Clear OTP input on failure
        setOtp("");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.dismiss(loadingToast);
      toast.error("Network error. Please check your connection and try again.");
    }
    setIsVerifyingOtp(false);
  };

  const handleVoteSubmission = async () => {
    if (selectedCandidate === null) return;

    setIsVoting(true);
    try {
      await onVote(selectedCandidate);
      toast.success("Vote cast successfully!");
    } catch (error) {
      console.error("Error casting vote:", error);
      toast.error("Error casting vote. Try again.");
    }
    setIsVoting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      {isResultsPublished ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-500 p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center"
          >
            <FaCheckCircle className="text-green-600 text-5xl mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Election Results Are Out!</h2>
            <p className="text-gray-700 mb-6 text-lg">You can now check the final election results.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/results")}
              className="px-6 py-3 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700 shadow-md transition"
            >
              Check Results
            </motion.button>
          </motion.div>
        </div>
      ) : !isActiveState ? (
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Voting is currently closed</h2>
      ) : hasVoted ? (
        <>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank you for voting!</h2>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Vote will be stored securely in blockchain</h2>
        </>
      ) : (
        <div className="space-y-8 p-6 bg-gray-100 rounded-xl shadow-lg">
          {/* Welcome Section with User Type Logo */}
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 flex items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <svg
                className="w-12 h-12 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm opacity-90">Voter Dashboard</p>
              <h2 className="text-2xl font-bold text-white">
                Welcome {voterName || 'Voter'}!
              </h2>
            </div>
          </motion.div>
          
          <motion.h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Cast Your Vote</motion.h2>
          <div className="grid gap-4">
            {candidates.map((candidate) => (
              <motion.button
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate.id)}
                className={`p-4 rounded-xl border-2 transition-all shadow-md cursor-pointer flex items-center gap-3 ${
                  selectedCandidate === candidate.id ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                }`}
              >
                <CheckCircle2 className="text-blue-600" />
                {candidate.name}
              </motion.button>
            ))}
          </div>
          <button
            onClick={() => setIsOtpModalOpen(true)}
            disabled={selectedCandidate === null || isVoting}
            className="px-8 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700"
          >
            Confirm Vote
          </button>
        </div>
      )}

      <Transition appear show={isOtpModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsOtpModalOpen(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                OTP Verification
              </Dialog.Title>
              <p className="text-sm text-gray-600 mb-4">
                Please verify your identity to proceed with voting.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-500">(+91)</span>
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="Enter 10-digit phone number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhoneNumber(value);
                      }}
                      className="border border-gray-300 p-3 rounded-r-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isOtpSent || isOtpLoading}
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 10-digit mobile number (country code +91 will be added automatically)
                  </p>
                </div>
                
                <button
                  onClick={sendOtp}
                  disabled={isOtpLoading || isOtpSent || !phoneNumber}
                  className="w-full bg-gray-600 text-white p-3 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOtpLoading ? "Sending..." : isOtpSent ? "OTP Sent ✓" : "Send OTP"}
                </button>

                {isOtpSent && (
                  <div className="mt-4">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      placeholder="Enter 4-6 digit OTP"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(value);
                      }}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      disabled={isVerifyingOtp}
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Check your phone for the OTP code
                    </p>
                  </div>
                )}

                {isOtpSent && (
                  <button
                    onClick={verifyOtp}
                    disabled={isVerifyingOtp || !otp || otp.length < 4}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                  </button>
                )}

                {isOtpSent && (
                  <button
                    onClick={() => {
                      setIsOtpSent(false);
                      setOtp("");
                      setPhoneNumber("");
                    }}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Change Phone Number
                  </button>
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};


// import React, { useState, useEffect } from 'react';
// import { Vote, CheckCircle2 } from 'lucide-react';
// import { Candidate } from '../types';

// interface VotingInterfaceProps {
//   candidates: Candidate[];
//   isActive: () => Promise<boolean>; 
//   hasVoted: boolean;
//   onVote: (candidateId: number) => Promise<void>;
// }

// export const VotingInterface: React.FC<VotingInterfaceProps> = ({
//   candidates,
//   isActive,
//   hasVoted,
//   onVote,
// }) => {
//   const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
//   const [isVoting, setIsVoting] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isActiveState, setIsActiveState] = useState<boolean>(false);

//   useEffect(() => {
//     const fetchStatus = async () => {
//       try {
//         const status = await isActive();
//         setIsActiveState(status);
//       } catch (err) {
//         console.error('Error fetching voting status:', err);
//         setError('Failed to fetch voting status.');
//       }
//     };

//     fetchStatus();
//   }, [isActive]);

//   const handleVote = async () => {
//     if (selectedCandidate === null) return;

//     setIsVoting(true);
//     try {
//       await onVote(selectedCandidate);
//     } catch (error) {
//       console.error('Error casting vote:', error);
//     }
//     setIsVoting(false);
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-8 text-center">
//       {!isActiveState ? (
//         <>
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">Voting is currently closed</h2>
//           <p className="text-gray-600">
//             Please wait for the Head of Election Commission to start the voting process.
//           </p>
//         </>
//       ) : hasVoted ? (
//         <>
//           <div className="flex justify-center mb-4">
//             <CheckCircle2 className="w-16 h-16 text-green-600" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank you for voting!</h2>
//           <p className="text-gray-600">Your vote has been securely recorded on the blockchain.</p>
//         </>
//       ) : (
//         <div className="space-y-8">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">Cast Your Vote</h2>
//           <div className="grid gap-4">
//             {candidates.map((candidate) => (
//               <button
//                 key={candidate.id}
//                 onClick={() => setSelectedCandidate(candidate.id)}
//                 className={`p-6 rounded-lg border-2 transition-all ${
//                   selectedCandidate === candidate.id
//                     ? 'border-blue-600 bg-blue-50'
//                     : 'border-gray-200 hover:border-blue-300'
//                 }`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="text-left">
//                     <h3 className="text-lg font-semibold">{candidate.name}</h3>
//                     <p className="text-gray-600">{candidate.partySymbol}</p>
//                   </div>
//                   {selectedCandidate === candidate.id && (
//                     <CheckCircle2 className="w-6 h-6 text-blue-600" />
//                   )}
//                 </div>
//               </button>
//             ))}
//           </div>

//           <div className="flex justify-center">
//             <button
//               onClick={handleVote}
//               disabled={selectedCandidate === null || isVoting}
//               className={`flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium ${
//                 selectedCandidate !== null && !isVoting
//                   ? 'bg-blue-600 hover:bg-blue-700'
//                   : 'bg-gray-400 cursor-not-allowed'
//               }`}
//             >
//               <Vote className="w-5 h-5" />
//               {isVoting ? 'Confirming Vote...' : 'Confirm Vote'}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
