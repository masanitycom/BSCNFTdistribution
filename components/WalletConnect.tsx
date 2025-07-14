"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onWalletConnected?: (address: string) => void;
  className?: string;
}

export default function WalletConnect({ onWalletConnected, className = "" }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string>("");

  useEffect(() => {
    checkWalletConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
          
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(chainId);
          
          if (onWalletConnected) {
            onWalletConnected(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setIsConnected(true);
      setWalletAddress(accounts[0]);
      if (onWalletConnected) {
        onWalletConnected(accounts[0]);
      }
    } else {
      setIsConnected(false);
      setWalletAddress("");
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(chainId);
    // Reload the page to avoid stale state
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMaskがインストールされていません。https://metamask.io からインストールしてください。");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainId);
        
        // Switch to BSC if not already
        await switchToBSC();
        
        if (onWalletConnected) {
          onWalletConnected(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("ウォレット接続に失敗しました");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToBSC = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC Mainnet
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x38',
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding BSC network:', addError);
        }
      }
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setChainId("");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case '0x38':
        return 'BSC Mainnet';
      case '0x61':
        return 'BSC Testnet';
      case '0x1':
        return 'Ethereum';
      default:
        return 'Unknown Network';
    }
  };

  if (isConnected) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="bg-gray-800 rounded-lg px-4 py-2">
          <div className="text-sm text-gray-300">
            {getNetworkName(chainId)}
          </div>
          <div className="text-white font-medium">
            {formatAddress(walletAddress)}
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
        >
          切断
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isConnecting ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
          接続中...
        </div>
      ) : (
        "MetaMask接続"
      )}
    </button>
  );
}