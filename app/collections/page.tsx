"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image_ipfs?: string;
  contract_address?: string;
  next_token_id: number;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hiding, setHiding] = useState<string | null>(null);

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

  const deleteCollection = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよろしいですか？\n\n注意: NFTが発行済みの場合は削除できません。`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/collections/${id}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setCollections(prev => prev.filter(c => c.id !== id));
        alert("コレクションが削除されました");
      } else {
        alert(data.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("削除中にエラーが発生しました");
    } finally {
      setDeleting(null);
    }
  };

  const hideCollection = async (id: string, name: string) => {
    if (!confirm(`「${name}」を非表示にしますか？\n\n非表示にしても、発行済みのNFTには影響しません。`)) {
      return;
    }

    setHiding(id);
    try {
      const response = await fetch(`/api/collections/${id}/hide`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setCollections(prev => prev.filter(c => c.id !== id));
        alert("コレクションを非表示にしました");
      } else {
        alert(data.error || "非表示に失敗しました");
      }
    } catch (error) {
      console.error("Hide error:", error);
      alert("非表示中にエラーが発生しました");
    } finally {
      setHiding(null);
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
              <div
                key={collection.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-200"
              >
                <Link href={`/collections/${collection.id}`} className="block">
                  {/* Collection Image */}
                  <div className="aspect-square bg-gray-800 rounded-t-xl overflow-hidden">
                    {collection.image_ipfs ? (
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${collection.image_ipfs}`}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ display: collection.image_ipfs ? 'none' : 'flex' }}
                    >
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">画像なし</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
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
                  
                  <h3 className="text-xl font-semibold text-white mb-2">
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
                  
                    <div className="mt-4 flex items-center text-gray-500 hover:text-gray-400 transition-colors">
                      <span className="text-sm">管理</span>
                      <svg className="w-4 h-4 ml-2 transform hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="px-6 pb-4 space-y-2">
                  {/* Hide Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      hideCollection(collection.id, collection.name);
                    }}
                    disabled={hiding === collection.id}
                    className="w-full px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 hover:text-yellow-300 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {hiding === collection.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                        <span>非表示中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878L12 12m6.121-6.121A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 01-4.243-4.243m1.414-1.414L8.464 8.464M12 12l2.121-2.121" />
                        </svg>
                        <span>非表示</span>
                      </>
                    )}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteCollection(collection.id, collection.name);
                    }}
                    disabled={deleting === collection.id}
                    className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {deleting === collection.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                        <span>削除中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>削除</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}