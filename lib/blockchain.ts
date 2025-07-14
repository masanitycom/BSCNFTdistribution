import { ethers } from "ethers";
import CollectionABI from "@/contracts/Collection.json";

export function getProvider(): ethers.JsonRpcProvider {
  const chainId = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID);
  const rpcUrl = chainId === 97 
    ? process.env.BSC_TEST_RPC! 
    : process.env.BSC_MAIN_RPC!;
  
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getWallet(): ethers.Wallet {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key not configured");
  }
  
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

export async function deployCollection(
  name: string,
  symbol: string,
  baseURI: string
): Promise<string> {
  try {
    const wallet = getWallet();
    const factory = new ethers.ContractFactory(
      CollectionABI.abi,
      CollectionABI.bytecode,
      wallet
    );

    const contract = await factory.deploy(name, symbol, baseURI);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    return address;
  } catch (error) {
    console.error("Contract deployment error:", error);
    throw new Error("コントラクトのデプロイに失敗しました");
  }
}

export async function mintNFT(
  contractAddress: string,
  to: string,
  tokenId: number
): Promise<string> {
  try {
    const wallet = getWallet();
    const contract = new ethers.Contract(
      contractAddress,
      CollectionABI.abi,
      wallet
    );

    const tx = await contract.adminMint(to, tokenId);
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error("Minting error:", error);
    throw new Error(`NFTのミントに失敗しました: ${error}`);
  }
}

export async function batchMintNFTs(
  contractAddress: string,
  recipients: { address: string; tokenId: number }[]
): Promise<{ success: boolean; txHash?: string; error?: string }[]> {
  const results: { success: boolean; txHash?: string; error?: string }[] = [];
  
  for (const recipient of recipients) {
    try {
      const txHash = await mintNFT(
        contractAddress,
        recipient.address,
        recipient.tokenId
      );
      results.push({ success: true, txHash });
    } catch (error: any) {
      results.push({ 
        success: false, 
        error: error.message || "Unknown error" 
      });
    }
  }
  
  return results;
}