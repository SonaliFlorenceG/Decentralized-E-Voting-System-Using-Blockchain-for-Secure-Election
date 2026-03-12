import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { HECDashboard } from './components/HECDashboard';
import { VotingInterface } from './components/VotingInterface';
import { ResultsDisplay } from './components/ResultsDisplay';
import { VoterRegistration } from './components/VoterRegistration';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Candidate } from './types';
import { FaVoteYea, FaShieldAlt, FaUsers, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import { CONTRACT_ADDRESS, VotingSystemABI } from './utils/contract';
import toast from 'react-hot-toast';

// HEC address (Head of Election Commission)
const HEC_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

function App() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if connected address is HEC
  const isHEC = address?.toLowerCase() === HEC_ADDRESS.toLowerCase();

  // Read contract state with refetch functions
  const { data: candidateCount, refetch: refetchCandidateCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingSystemABI,
    functionName: 'getCandidateCount',
    query: {
      enabled: isConnected,
    },
  });

  const { data: isActive, refetch: refetchIsActive } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingSystemABI,
    functionName: 'getisActive',
    query: {
      enabled: isConnected,
    },
  });

  const { data: resultsPublished, refetch: refetchResultsPublished } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingSystemABI,
    functionName: 'isresultsPublished',
    query: {
      enabled: isConnected,
    },
  });

  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingSystemABI,
    functionName: 'hasVoted',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Check if user is registered voter
  const { data: isRegistered, refetch: refetchRegistration } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingSystemABI,
    functionName: 'isRegisteredVoter',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !isHEC,
    },
  });

  // Get voter profile (name) for registered voters
  const { data: voterProfile, refetch: refetchVoterProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingSystemABI,
    functionName: 'voterProfiles',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !isHEC && isRegistered === true,
    },
  });

  // Refetch all data after successful transaction
  useEffect(() => {
    if (isConfirmed && hash) {
      // Small delay to ensure transaction is processed on blockchain
      const timer = setTimeout(() => {
        refetchCandidateCount();
        refetchIsActive();
        refetchResultsPublished();
        refetchHasVoted();
        refetchRegistration();
        refetchVoterProfile();
        loadCandidates(); // Reload candidates list
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, hash, refetchCandidateCount, refetchIsActive, refetchResultsPublished, refetchHasVoted, refetchRegistration, refetchVoterProfile]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load candidates using public client
  const loadCandidates = async () => {
    try {
      if (!isConnected || !candidateCount) return;
      
      const count = Number(candidateCount);
      const candidatesList: Candidate[] = [];
      
      // Use public client to read candidates
      const { config } = await import('./config/wagmi');
      const { createPublicClient, http } = await import('viem');
      
      const publicClient = createPublicClient({
        chain: config.chains[0],
        transport: http(),
      });

      for (let i = 1; i <= count; i++) {
        try {
          const candidate = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: VotingSystemABI,
            functionName: 'getCandidate',
            args: [BigInt(i)],
          });

          if (candidate) {
            candidatesList.push({
              id: Number(candidate[0]),
              name: candidate[1],
              partySymbol: candidate[2],
              voteCount: Number(candidate[3]),
            });
          }
        } catch (error) {
          console.error(`Error reading candidate ${i}:`, error);
        }
      }
      
      setCandidates(candidatesList);
      setError(null);
    } catch (error) {
      console.error('Error loading candidates:', error);
      setError('Failed to load candidates. Please try again.');
    }
  };

  useEffect(() => {
    if (isConnected && candidateCount) {
      loadCandidates();
    }
  }, [isConnected, candidateCount, isConfirmed]);

  // Watch for transaction success to reload candidates and refresh registration status
  useEffect(() => {
    if (isConfirmed) {
      loadCandidates();
      // Registration status will be automatically refetched by useReadContract
      // when the query is re-enabled or when address changes
    }
  }, [isConfirmed]);

  const getActive = async (): Promise<boolean> => {
    try {
      if (isActive !== undefined) {
        return Boolean(isActive);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
    return false;
  };

  const getresultsPublished = async (): Promise<boolean> => {
    try {
      if (resultsPublished !== undefined) {
        return Boolean(resultsPublished);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
    return false;
  };

  const handleAddCandidate = async (name: string, partySymbol: string) => {
    try {
      if (isHEC) {
        setError(null);
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: VotingSystemABI,
          functionName: 'addCandidate',
          args: [name, partySymbol],
        });
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      setError('Failed to add candidate. Please try again.');
    }
  };

  const handleStartVoting = async () => {
    try {
      if (isHEC) {
        setError(null);
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: VotingSystemABI,
          functionName: 'startVoting',
        });
      }
    } catch (error) {
      console.error('Error starting voting:', error);
      setError('Failed to start voting. Please try again.');
    }
  };

  const handleStopVoting = async () => {
    try {
      if (isHEC) {
        setError(null);
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: VotingSystemABI,
          functionName: 'stopVoting',
        });
      }
    } catch (error) {
      console.error('Error stopping voting:', error);
      setError('Failed to stop voting. Please try again.');
    }
  };

  const handlePublishResults = async () => {
    try {
      if (isHEC) {
        setError(null);
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: VotingSystemABI,
          functionName: 'publishResults',
        });
      }
    } catch (error) {
      console.error('Error publishing results:', error);
      setError('Failed to publish results. Please try again.');
    }
  };

  const handleVote = async (candidateId: number) => {
    try {
      if (!hasVoted) {
        setError(null);
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: VotingSystemABI,
          functionName: 'vote',
          args: [BigInt(candidateId)],
        });
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      setError('Failed to cast vote. Please try again.');
    }
  };

  const handleRegisterVoter = async (name: string, age: number, location: string) => {
    try {
      setError(null);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: VotingSystemABI,
        functionName: 'registerVoter',
        args: [name, BigInt(age), location],
      });
    } catch (error) {
      console.error('Error registering voter:', error);
      setError('Failed to register. Please try again.');
      throw error;
    }
  };

  // Handle write errors (including MetaMask rejection)
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || 'Transaction failed. Please try again.';
      setError(errorMessage);
      
      // Check if user rejected the transaction
      if (writeError.message?.includes('User rejected') || 
          writeError.message?.includes('user rejected') ||
          writeError.message?.includes('rejected') ||
          writeError.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected');
      } else {
        toast.error(errorMessage);
      }
    }
  }, [writeError]);

  // Dummy connect function for Header (Rainbow Kit handles connection)
  const connectWallet = async () => {
    // Rainbow Kit handles connection via ConnectButton
    // This is kept for compatibility with Header component
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header
          onConnect={connectWallet}
          isConnected={isConnected}
          address={address}
          isHEC={isHEC}
          isRegistered={isRegistered as boolean | undefined}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-center">
                  {!isConnected && (
                    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex flex-col items-center justify-center p-6">
                      {/* Header Section */}
                      <div className="text-center max-w-4xl">
                        <h1 className="text-5xl font-extrabold mb-4">🗳️ Blockchain Voting</h1>
                        <p className="text-lg text-gray-200 mb-6">
                          A secure, transparent, and decentralized way to cast your vote.
                        </p>
                      </div>

                      {/* Features Section */}
                      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md flex flex-col items-center">
                          <FaVoteYea className="text-4xl text-blue-600 mb-3" />
                          <h3 className="text-xl font-semibold">Secure Voting</h3>
                          <p className="text-sm">Blockchain ensures transparency & security.</p>
                        </div>

                        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md flex flex-col items-center">
                          <FaUsers className="text-4xl text-green-600 mb-3" />
                          <h3 className="text-xl font-semibold">Voter Privacy</h3>
                          <p className="text-sm">Your identity & vote remain anonymous.</p>
                        </div>

                        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-md flex flex-col items-center">
                          <FaShieldAlt className="text-4xl text-purple-600 mb-3" />
                          <h3 className="text-xl font-semibold">Immutable Records</h3>
                          <p className="text-sm">Once cast, votes cannot be altered.</p>
                        </div>
                      </div>

                      {/* Rights of Citizens */}
                      <div className="bg-blue-800 p-6 rounded-xl mt-12 shadow-lg max-w-3xl text-center">
                        <h2 className="text-2xl font-semibold mb-3">📜 Rights of Citizens</h2>
                        <ul className="text-gray-200 text-left list-disc list-inside">
                          <li>Right to vote freely & fairly.</li>
                          <li>Right to privacy while voting.</li>
                          <li>Right to access candidate information.</li>
                          <li>Right to seek assistance when required.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {isConnected && isHEC && (
                    // Administration Section (for HEC)
                    <div className="p-6">
                      <motion.h1
                        className="text-4xl font-bold text-gray-900 mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        Election Administration Panel
                      </motion.h1>
                      <motion.p
                        className="text-lg text-gray-600 mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      >
                        Manage elections, start/stop voting, and publish results.
                      </motion.p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          {
                            title: "Voting Administration",
                            img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBubXyOAcfekQVn3tAH_JHF-3Oeb40QnV1Og&s",
                          },
                          {
                            title: "Manage Elections",
                            img: "https://s3-eu-west-1.amazonaws.com/alt-cdn/chrysos/images/blog/140/og/top-tips-for-leading-managing-57dfddf333ef0.jpg",
                          },
                          {
                            title: "Publish Results",
                            img: "https://media.istockphoto.com/id/2012725651/vector/indian-general-election-2024-vector-illustration.jpg?s=612x612&w=0&k=20&c=H1rr0uOsOruJVjgIBbaUBkrklv8BK8cwNlFKpbHceF8=",
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            className="bg-gray-100 p-4 rounded-lg shadow-md"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <img
                              src={item.img}
                              alt={item.title}
                              className="w-full h-40 object-cover rounded"
                            />
                            <p className="text-lg font-semibold mt-2">{item.title}</p>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        className="mt-8 p-4 bg-gray-200 rounded-lg text-left"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      >
                        <h2 className="text-xl font-semibold mb-2">General Instructions for Administration</h2>
                        <ul className="list-disc list-inside text-gray-700">
                          <li>Ensure all election configurations are set up before starting.</li>
                          <li>Monitor voting progress regularly and address any issues.</li>
                          <li>Stop voting only after the official voting period ends.</li>
                          <li>Verify and publish election results accurately.</li>
                          <li>Maintain system security and prevent unauthorized access.</li>
                        </ul>
                      </motion.div>
                    </div>
                  )}

                  {isConnected && !isHEC && (
                    // Check registration status
                    isRegistered === false ? (
                      // Show registration form if not registered
                      <VoterRegistration
                        onRegister={handleRegisterVoter}
                        isRegistering={isPending || isConfirming}
                        error={error}
                      />
                    ) : isRegistered === true ? (
                      // Standard User Section (registered voters)
                      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6">
                        <motion.div
                          className="bg-white shadow-2xl rounded-3xl p-10 max-w-4xl w-full text-center transform transition-all hover:scale-105 hover:shadow-3xl"
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {/* Header Section */}
                          <motion.h1
                            className="text-4xl font-extrabold text-gray-900 mb-6"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            🗳️ Your single Vote Can be a Game change of state
                          </motion.h1>
                          <p className="text-lg text-gray-700 mb-8">
                            To Vote Please click On Voting Panel
                          </p>

                          {/* Do's and Don'ts While Voting */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Do's Section */}
                            <motion.div
                              className="bg-green-200 p-6 rounded-2xl shadow-lg border-l-8 border-green-600"
                              whileHover={{ scale: 1.05 }}
                            >
                              <h2 className="text-2xl font-semibold text-green-900 mb-4">
                                ✅ Do's While Voting
                              </h2>
                              <ul className="text-gray-800 text-left list-disc list-inside">
                                <li>Ensure your wallet is connected securely.</li>
                                <li>Verify candidate details before voting.</li>
                                <li>Follow proper voting guidelines.</li>
                                <li>Report any suspicious activities.</li>
                              </ul>
                            </motion.div>

                            {/* Don'ts Section */}
                            <motion.div
                              className="bg-red-200 p-6 rounded-2xl shadow-lg border-l-8 border-red-600"
                              whileHover={{ scale: 1.05 }}
                            >
                              <h2 className="text-2xl font-semibold text-red-900 mb-4">
                                ❌ Don'ts While Voting
                              </h2>
                              <ul className="text-gray-800 text-left list-disc list-inside">
                                <li>Do not share your voting key or wallet address.</li>
                                <li>Avoid voting under pressure or influence.</li>
                                <li>Do not refresh the page while voting.</li>
                                <li>Never disclose your private keys.</li>
                              </ul>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    ) : (
                      // Loading state while checking registration
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Checking registration status...</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              }
            />

            <Route
              path="/hec-dashboard"
              element={
                isHEC ? (
                  <HECDashboard
                    candidates={candidates}
                    isActive={getActive}
                    resultsPublished={getresultsPublished}
                    onAddCandidate={handleAddCandidate}
                    onStartVoting={handleStartVoting}
                    onStopVoting={handleStopVoting}
                    onPublishResults={handlePublishResults}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/vote"
              element={
                isConnected && !isHEC && isRegistered === true ? (
                  <VotingInterface
                    candidates={candidates}
                    isActive={getActive}
                    hasVoted={Boolean(hasVoted)}
                    onVote={handleVote}
                    resultsPublished={getresultsPublished}
                    voterName={voterProfile ? String((voterProfile as any)[0] || '') : undefined}
                  />
                ) : isConnected && !isHEC && isRegistered === false ? (
                  <Navigate to="/" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/results"
              element={
                <ResultsDisplay
                  candidates={candidates}
                  resultsPublished={getresultsPublished}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
