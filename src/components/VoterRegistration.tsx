import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle } from 'lucide-react';

interface VoterRegistrationProps {
  onRegister: (name: string, age: number, location: string) => Promise<void>;
  isRegistering: boolean;
  error: string | null;
}

export const VoterRegistration: React.FC<VoterRegistrationProps> = ({
  onRegister,
  isRegistering,
  error,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!name.trim()) {
      setValidationError('Please enter your name');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 18) {
      setValidationError('You must be at least 18 years old to register');
      return;
    }

    if (!location.trim()) {
      setValidationError('Please enter your location');
      return;
    }

    try {
      await onRegister(name.trim(), ageNum, location.trim());
      // Reset form on success
      setName('');
      setAge('');
      setLocation('');
    } catch (err) {
      // Error is handled by parent component
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <motion.div
        className="bg-white shadow-2xl rounded-3xl p-10 max-w-2xl w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="w-16 h-16 text-amber-500" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Voter Registration Required
          </h2>
          <p className="text-gray-600">
            You need to register as a voter before accessing the voting dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              disabled={isRegistering}
              required
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your age (must be 18 or older)"
              min="18"
              max="120"
              disabled={isRegistering}
              required
            />
            <p className="mt-1 text-sm text-gray-500">Must be at least 18 years old</p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your location (City, State)"
              disabled={isRegistering}
              required
            />
          </div>

          {(error || validationError) && (
            <motion.div
              className="p-4 bg-red-50 border border-red-200 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-red-600 text-sm">{error || validationError}</p>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isRegistering}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isRegistering ? 1 : 1.02 }}
            whileTap={{ scale: isRegistering ? 1 : 0.98 }}
          >
            <UserPlus className="w-5 h-5" />
            {isRegistering ? 'Registering...' : 'Register as Voter'}
          </motion.button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your registration information will be stored securely on the blockchain. 
            This is a one-time registration process.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

