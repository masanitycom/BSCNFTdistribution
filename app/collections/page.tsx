"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  contract_address?: string;
  next_token_id: number;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">コレクション一覧</h1>
            <p className="text-gray-400">作成されたNFTコレクションを管理</p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white transition-colors"
            >
              ダッシュボードに戻る
            </Link>
            <Link
              href="/collections/new"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>新しいコレクション</span>
            </Link>
          </div>
        </div>

        {/* Collections grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">読み込み中...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">コレクションがありません</h3>
            <p className="text-gray-400 mb-6">最初のNFTコレクションを作成しましょう</p>
            <Link
              href="/collections/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              コレクションを作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="block group"
              >
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 group-hover:bg-gray-900/70">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-600/20 rounded-lg">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex items-center space-x-2">
                      {collection.contract_address ? (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                          デプロイ済み
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                          未デプロイ
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gray-100">
                    {collection.name}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {collection.description || "説明なし"}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">シンボル:</span>
                      <span className="text-gray-300">{collection.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">次のトークンID:</span>
                      <span className="text-gray-300">{collection.next_token_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">作成日:</span>
                      <span className="text-gray-300">
                        {new Date(collection.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-gray-500 group-hover:text-gray-400 transition-colors">
                    <span className="text-sm">管理</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}