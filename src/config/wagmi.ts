// import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// // Anvil chain configuration (chain ID 31337, localhost:8545)
// const anvilChain = {
//   id: 31337,
//   name: 'Anvil',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ether',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     default: {
//       http: ['http://localhost:8545'],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Anvil',
//       url: 'http://localhost:8545',
//     },
//   },
//   testnet: true,
// } as const;

// // Get project ID from environment or use placeholder (user will replace)
// const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ffd9c14979b35512b37295583be3d623';

// export const config = getDefaultConfig({
//   appName: 'Blockchain Voting System',
//   projectId: projectId,
//   chains: [anvilChain],
//   ssr: false, // If your dApp uses server-side rendering (SSR)
// });


import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
};

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'ffd9c14979b35512b37295583be3d623';

export const config = getDefaultConfig({
  appName: 'Blockchain Voting System',
  projectId: projectId,
  chains: [baseSepolia],
  ssr: false,
});
