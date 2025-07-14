"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface DashboardStats {
  totalCollections: number;
  totalNFTs: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCollections: 0,
    totalNFTs: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: "new-collection",
      title: "新しいコレクション作成",
      description: "NFTコレクションを作成してデプロイ",
      href: "/collections/new",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: "from-blue-600 to-blue-700"
    },
    {
      id: "collections",
      title: "コレクション一覧",
      description: "既存のコレクションを管理",
      href: "/collections",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "from-purple-600 to-purple-700"
    },
    {
      id: "gallery",
      title: "パブリックギャラリー",
      description: "発行済みNFTを閲覧",
      href: "/gallery",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "from-green-600 to-green-700"
    },
    {
      id: "settings",
      title: "設定",
      description: "システム設定とネットワーク切り替え",
      href: "/settings",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "from-orange-600 to-orange-700"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-800/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">ダッシュボード</h1>
              <p className="text-gray-400">BSC NFT Distribution System</p>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-white transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">コレクション数</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.totalCollections}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">発行済みNFT</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.totalNFTs}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">配布ジョブ</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.totalUsers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="block group"
            >
              <div className={`
                relative bg-gray-900/50 border rounded-xl p-8 transition-all duration-300 transform
                ${hoveredCard === item.id 
                  ? 'border-gray-600 scale-[1.02] bg-gray-900/70' 
                  : 'border-gray-800 hover:border-gray-700'
                }
              `}>
                {/* Gradient overlay on hover */}
                <div className={`
                  absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300
                  bg-gradient-to-br ${item.color}
                  ${hoveredCard === item.id ? 'opacity-10' : ''}
                `}></div>
                
                <div className="relative z-10">
                  <div className={`
                    inline-flex p-4 rounded-xl mb-4 transition-all duration-300
                    ${hoveredCard === item.id 
                      ? `bg-gradient-to-r ${item.color} text-white` 
                      : 'bg-gray-800 text-gray-400'
                    }
                  `}>
                    {item.icon}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-gray-100 transition-colors">
                    {item.title}
                  </h2>
                  
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {item.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-gray-500 group-hover:text-gray-400 transition-colors">
                    <span className="text-sm">開く</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}