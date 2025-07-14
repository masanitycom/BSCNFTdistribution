"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Helper function for IPFS URL
const getIPFSUrl = (hash: string) => `https://gateway.pinata.cloud/ipfs/${hash}`;

interface NFTDisplay {
  id: string;
  token_id: number;
  owner_address: string;
  collection: {
    name: string;
    symbol: string;
    image_ipfs: string;
  };
}

export default function GalleryPage() {
  const [nfts, setNfts] = useState<NFTDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | string>("all");
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    fetchNFTs();
  }, []);

  const fetchNFTs = async () => {
    try {
      const response = await fetch("/api/gallery");
      if (response.ok) {
        const data = await response.json();
        setNfts(data.nfts);
        
        // Extract unique collections
        const uniqueCollections = [...new Set(data.nfts.map((nft: NFTDisplay) => nft.collection.name))] as string[];
        setCollections(uniqueCollections);
      }
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = filter === "all" 
    ? nfts 
    : nfts.filter(nft => nft.collection.name === filter);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">NFT ギャラリー</h1>
              <p className="text-gray-400">発行済みのすべてのNFTを閲覧</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white transition-colors"
            >
              ダッシュボードに戻る
            </Link>
          </div>

          {/* Filters */}
          {collections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                すべて ({nfts.length})
              </button>
              {collections.map(collection => {
                const count = nfts.filter(nft => nft.collection.name === collection).length;
                return (
                  <button
                    key={collection}
                    onClick={() => setFilter(collection)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filter === collection
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {collection} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* NFT Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">読み込み中...</p>
          </div>
        ) : filteredNFTs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">NFTがありません</h3>
            <p className="text-gray-400">まだNFTが発行されていません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredNFTs.map((nft) => (
              <div
                key={nft.id}
                className="group relative bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-200"
              >
                {/* NFT Image */}
                <div className="aspect-square bg-gray-800 relative overflow-hidden">
                  {nft.collection.image_ipfs ? (
                    <img
                      src={getIPFSUrl(nft.collection.image_ipfs)}
                      alt={`${nft.collection.name} #${nft.token_id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/api/placeholder/400/400";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Token ID Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-sm font-mono">
                    #{nft.token_id}
                  </div>
                </div>

                {/* NFT Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {nft.collection.name} #{nft.token_id}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">{nft.collection.symbol}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500">所有者:</span>
                      <p className="text-gray-300 font-mono mt-1">
                        {nft.owner_address.slice(0, 6)}...{nft.owner_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-4 left-4 right-4">
                    <button
                      onClick={() => window.open(`https://testnet.bscscan.com/address/${nft.owner_address}`, "_blank")}
                      className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                      BSCScanで見る
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        {filteredNFTs.length > 12 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                前へ
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                1
              </button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                2
              </button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}