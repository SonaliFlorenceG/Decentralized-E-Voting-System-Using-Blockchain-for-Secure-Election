import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';
import { Candidate } from '../types';
import { FaHourglassHalf } from "react-icons/fa";
import { motion } from "framer-motion";


interface ResultsDisplayProps {
  candidates: Candidate[];
  resultsPublished: () => Promise<boolean>;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  candidates,
  resultsPublished,
}) => {
  const [isResultsPublished, setIsResultsPublished] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkResults = async () => {
      try {
        const published = await resultsPublished();
        console.log(published);
        setIsResultsPublished(published);
      } catch (error) {
        console.error('Error fetching results status:', error);
        setError("Error fetching");
      }
    };
    checkResults();
  }, [resultsPublished]);

  // if (isResultsPublished === null) {
  //   return <p className="text-gray-600 text-center">Checking results status...</p>;
  // }

  if (!isResultsPublished) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-yellow-600 text-5xl mb-4"
        >
          <FaHourglassHalf />
        </motion.div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Please connect Your wallet First
        </h2>
        <p className="text-gray-700 mb-6 text-lg">
         You can find it Top Right corner
        </p>
      </motion.div>
    </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No results available</h2>
        <p className="text-gray-600">There are no candidates or votes to display.</p>
      </div>
    );
  }

  const sortedCandidates = candidates.sort((a, b) => 
    Number(b.voteCount) - Number(a.voteCount)
);
  const winner = sortedCandidates[0] ?? null;
  const totalVotes = sortedCandidates.reduce(
    (acc, val) => acc + Number(val.voteCount), 
    0
  );
  

  return (
    <div className="space-y-8 p-4">
      {/* Winner Section */}
      <motion.div 
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {winner && (
          <div className="text-center mb-8">
            <motion.div className="flex justify-center mb-4" animate={{ scale: [0.8, 1.2, 1] }}>
              <Trophy className="w-16 h-16 text-yellow-300" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">{winner.name}</h2>
            <p className="text-xl">
              Winner with {((Number(winner.voteCount) / Number(totalVotes)) * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </motion.div>

      {/* Chart Section */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Vote Distribution</h3>
        <div className="h-64 w-3/4 mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={candidates.map(c => ({ ...c, voteCount: Number(c.voteCount) }))}>
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis stroke="#8884d8" />
              <Tooltip />
              <Bar dataKey="voteCount" fill="#ef4444" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detailed Results Section */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6" 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Detailed Results</h3>
        <div className="space-y-4">
          {sortedCandidates.map((candidate, index) => (
            <motion.div 
              key={candidate.id} 
              className={`flex items-center justify-between p-3 rounded-lg ${index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
            >
              <div>
                <img src={candidate.partySymbol} alt="Party Symbol" className="w-20 h-20 mr-4" />
                <h4 className="font-semibold text-lg text-gray-900">{candidate.name}</h4>
              </div>
              <div className="text-right">
                <p className="font-semibold text-xl text-blue-600">{candidate.voteCount} votes</p>
                <p className="text-gray-600">
                  {((Number(candidate.voteCount) / Number(totalVotes)) * 100).toFixed(1)}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
