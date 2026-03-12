import React, { useEffect, useState } from 'react';
import { PlusCircle, Play, Square, LineChart, AlertCircle } from 'lucide-react';
import { Candidate } from '../types';
import { useNavigate } from "react-router-dom";

interface HECDashboardProps {
  candidates: Candidate[];
  isActive: () => Promise<boolean>; // Fetches active status dynamically
   resultsPublished: () => Promise<boolean>;
  onAddCandidate: (name: string, partySymbol: string) => void;
  onStartVoting: () => void;
  onStopVoting: () => void;
  onPublishResults: () => void;
}

export const HECDashboard: React.FC<HECDashboardProps> = ({
  candidates,
  isActive,
  resultsPublished,
  onAddCandidate,
  onStartVoting,
  onStopVoting,
  onPublishResults,
}) => {
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newPartySymbol, setNewPartySymbol] = useState('');
  const [activeStatus, setActiveStatus] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultsPublished, setIsResultsPublished] = useState<boolean>(false);
  const navigate = useNavigate();
 
   useEffect(() => {
     const fetchData = async () => {
       try {
         const status = await isActive();
        setActiveStatus(status);
   
         const published = await resultsPublished();
         console.log(published);
         setIsResultsPublished(published);
       } catch (err) {
         console.error('Error fetching data:', err);
         setError('Failed to fetch voting status or results publication status.');
       }
     };
   
     fetchData();
   }, [isActive, resultsPublished]);
   

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCandidateName && newPartySymbol) {
      onAddCandidate(newCandidateName, newPartySymbol);
      setNewCandidateName('');
      setNewPartySymbol('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Election Control Panel</h2>
        <div className="flex gap-4 mb-6">
          {!activeStatus ? (
            <button
              onClick={onStartVoting}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              disabled={candidates.length < 2}
            >
              <Play className="w-5 h-5" />
              Start Voting
            </button>
          ) : (
            <button
              onClick={onStopVoting}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <Square className="w-5 h-5" />
              Stop Voting
            </button>
          )}
          <button
            onClick={onPublishResults}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            disabled={activeStatus || isResultsPublished}
          >
            <LineChart className="w-5 h-5" />
            Publish Results
          </button>
        </div>
        {candidates.length < 2 && !activeStatus && (
          <div className="flex items-center gap-2 text-amber-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>Add at least 2 candidates to start the election</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Candidate</h2>
        <form onSubmit={handleAddCandidate} className="space-y-4">
          <div>
            <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">
              Candidate Name
            </label>
            <input
              type="text"
              id="candidateName"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={activeStatus}
            />
          </div>
          <div>
            <label htmlFor="partySymbol" className="block text-sm font-medium text-gray-700">
              Party Symbol
            </label>
            <input
              type="text"
              id="partySymbol"
              value={newPartySymbol}
              onChange={(e) => setNewPartySymbol(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={activeStatus}
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            disabled={activeStatus}
          >
            <PlusCircle className="w-5 h-5" />
            Add Candidate
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 text-center">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Registered Candidates</h2>
  <div className="grid gap-4">
    {candidates.map((candidate) => (
      <div key={candidate.id} className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <img src={candidate.partySymbol} alt="Party Symbol" className="w-20 h-20 mr-4" />
        <h3 className="font-semibold text-lg">{candidate.name}</h3>
      </div>
    ))}
  </div>

  {isResultsPublished && (
    <div className="flex flex-col items-center mt-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Election Results Are Out!</h2>
      <p className="text-gray-600 mb-4">You can now check the final election results.</p>
      <button
        onClick={() => navigate("/results")}
        className="px-6 py-3 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700"
      >
        Check Results
      </button>
    </div>
  )}
</div>


      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};
