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
    // Add a small delay to avoid immediate conflicts
    const timer = setTimeout(() => {
      checkWalletConnection();
    }, 100);
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        clearTimeout(timer);
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
    
    return () => clearTimeout(timer);
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum && !isConnecting) {
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
      } catch (error: any) {
        // Ignore errors during initial check to avoid spam
        if (error?.code !== -32002) {
          console.error("Error checking wallet connection:", error);
        }
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

    if (isConnecting) {
      return; // Prevent multiple connection attempts
    }

    setIsConnecting(true);
    try {
      // First check if already connected
      const existingAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      let accounts;
      if (existingAccounts.length > 0) {
        accounts = existingAccounts;
      } else {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
      }

      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainId);
        
        // Switch to BSC if not already
        if (chainId !== '0x38') {
          await switchToBSC();
        }
        
        if (onWalletConnected) {
          onWalletConnected(accounts[0]);
        }
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (error.code === -32002) {
        alert("MetaMaskに接続リクエストが既に送信されています。MetaMaskを確認してください。");
      } else if (error.code === 4001) {
        // User rejected the request
        alert("ユーザーがウォレット接続を拒否しました");
      } else {
        alert("ウォレット接続に失敗しました");
      }
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
        } catch (addError: any) {
          console.error('Error adding BSC network:', addError);
          if (addError.code !== 4001) { // Don't alert if user rejected
            alert('BSCネットワークの追加に失敗しました');
          }
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        console.log('User rejected network switch');
      } else {
        console.error('Error switching to BSC network:', switchError);
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