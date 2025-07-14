"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [chainId, setChainId] = useState<string>("56");
  const [rpcUrl, setRpcUrl] = useState<string>("");
  const [pinataJwt, setPinataJwt] = useState<string>("");

  useEffect(() => {
    // Load current settings from environment or local storage
    const currentChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "56";
    setChainId(currentChainId);
  }, []);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">設定</h1>
            <p className="text-gray-400">システム設定の管理</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white transition-colors"
          >
            ダッシュボードに戻る
          </Link>
        </div>

        {/* Settings Form */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">ブロックチェーン設定</h2>
          
          <div className="space-y-6">
            {/* Chain ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                チェーンID
              </label>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="56">BSC Mainnet (56)</option>
                <option value="97">BSC Testnet (97)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                現在: {chainId === "56" ? "BSC Mainnet" : "BSC Testnet"}
              </p>
            </div>

            {/* Current Environment Variables */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">環境変数情報</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    NEXT_PUBLIC_DEFAULT_CHAIN_ID
                  </label>
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "未設定"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    PINATA_JWT
                  </label>
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {process.env.PINATA_JWT ? "設定済み (***)" : "未設定"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    BSC_RPC_URL
                  </label>
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {process.env.BSC_RPC_URL ? "設定済み" : "未設定（デフォルト使用）"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    BSC_TESTNET_RPC_URL
                  </label>
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {process.env.BSC_TESTNET_RPC_URL ? "設定済み" : "未設定（デフォルト使用）"}
                  </div>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="border-t border-gray-800 pt-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-300 mb-1">環境変数の変更について</h4>
                    <p className="text-xs text-blue-400">
                      環境変数を変更するには、Vercelのダッシュボードで設定を更新し、
                      再デプロイが必要です。設定変更後は必ずアプリケーションを再起動してください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/collections"
            className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
          >
            <h3 className="text-lg font-medium text-white mb-2">コレクション</h3>
            <p className="text-gray-400 text-sm">NFTコレクションの管理</p>
          </Link>
          
          <Link
            href="/gallery"
            className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
          >
            <h3 className="text-lg font-medium text-white mb-2">ギャラリー</h3>
            <p className="text-gray-400 text-sm">公開NFTギャラリー</p>
          </Link>
          
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">システム情報</h3>
            <p className="text-gray-400 text-sm">Next.js 15 + Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
}