import React from 'react';
import { Vote } from 'lucide-react';
import { WalletConnect } from './WalletConnect';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";

interface HeaderProps {
  onConnect: () => Promise<void>;
  isConnected: boolean;
  address?: string;
  isHEC: boolean;
  isRegistered?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onConnect,
  isConnected,
  address,
  isHEC,
  isRegistered,
}) => {
  return (
        <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300 shadow-xl border-b-4 border-yellow-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wide drop-shadow-lg">
            ELECTION COMMISSION OF INDIA
          </h1>
          <div className="flex justify-between items-center w-full mt-4">
          <motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.1 }}
  transition={{ duration: 0.3 }}
>
  <Link to="/" className="flex items-center gap-2">
    <Vote className="w-10 h-10 text-lime-400 drop-shadow-lg" />
    <span className="text-2xl font-bold text-lime-400 drop-shadow-lg">
      Blockchain Voting
    </span>
  </Link>
</motion.div>
            <div className="flex items-center gap-4">
              {isConnected && isHEC && (
                <Link
                  to="/hec-dashboard"
                  className="bg-gradient-to-r from-indigo-500 to-purple-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform transform hover:scale-110 hover:shadow-xl border-2 border-white"
                >
                  HEC Dashboard
                </Link>
              )}
              {isConnected && !isHEC && isRegistered === true && (
                <Link
                  to="/vote"
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform transform hover:scale-110 hover:shadow-xl border-2 border-white"
                >
                  Voting Panel
                </Link>
              )}
              <WalletConnect
                onConnect={onConnect}
                isConnected={isConnected}
                address={address}
              />
            </div>
          </div>
        </div>
      </div>
    </header>

  );
};