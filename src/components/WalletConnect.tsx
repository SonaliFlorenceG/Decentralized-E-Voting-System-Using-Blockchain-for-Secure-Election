import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface WalletConnectProps {
  onConnect: () => Promise<void>;
  isConnected: boolean;
  address?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  isConnected,
  address,
}) => {
  return (
    <div className="flex items-center gap-2">
      <ConnectButton />
    </div>
  );
};