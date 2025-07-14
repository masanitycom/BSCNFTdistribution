"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image_ipfs?: string;
  metadata_ipfs?: string;
  contract_address?: string;
  next_token_id: number;
  created_at: string;
}

interface CSVRow {
  wallet_address: string;
  collection_slug: string;
  quantity: string;
  recipient_name: string;
  distribution_date: string;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "distribute" | "logs">("info");
  const [nftHistory, setNftHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCollection(params.id as string);
    }
  }, [params.id]);

  const fetchNFTHistory = async (collectionId: string) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/nfts`);
      if (response.ok) {
        const data = await response.json();
        setNftHistory(data.nfts || []);
      }
    } catch (error) {
      console.error("Failed to fetch NFT history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCollection = async (id: string) => {
    try {
      const response = await fetch(`/api/collections/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data);
      } else {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Failed to fetch collection:", error);
      router.push("/collections");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError("");
    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as CSVRow[];
          
          // Validate CSV format
          const requiredColumns = ['wallet_address', 'collection_slug', 'quantity', 'recipient_name', 'distribution_date'];
          const csvColumns = Object.keys(data[0] || {});
          const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));
          
          if (missingColumns.length > 0) {
            setCsvError(`必要な列が不足しています: ${missingColumns.join(', ')}`);
            setUploading(false);
            return;
          }

          // Validate data
          const invalidRows = data.filter((row, index) => {
            if (!row.wallet_address || !row.wallet_address.startsWith('0x')) {
              setCsvError(`行 ${index + 1}: 無効なウォレットアドレス`);
              return true;
            }
            if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) < 1) {
              setCsvError(`行 ${index + 1}: 無効な数量`);
              return true;
            }
            return false;
          });

          if (invalidRows.length > 0) {
            setUploading(false);
            return;
          }

          setCsvData(data);
          setUploading(false);
        } catch (error) {
          setCsvError("CSVファイルの解析に失敗しました");
          setUploading(false);
        }
      },
      error: (error) => {
        setCsvError(`CSVファイルの読み込みに失敗しました: ${error.message}`);
        setUploading(false);
      }
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !collection) return;

    console.log("Image upload started:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      collectionId: collection.id
    });

    setUploading(true);
    setCsvError("");
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      console.log("Sending upload request...");

      const response = await fetch(`/api/collections/${collection.id}/upload-image`, {
        method: "POST",
        body: formData,
      });

      console.log("Upload response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log("Upload response data:", data);

      if (response.ok) {
        setCollection(prev => prev ? { ...prev, image_ipfs: data.imageHash } : null);
        console.log("Image upload successful:", data.imageHash);
      } else {
        console.error("Upload failed:", data);
        setCsvError(data.error || "画像のアップロードに失敗しました");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setCsvError("画像のアップロード中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const handleDeploy = async () => {
    if (!collection) return;

    setUploading(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}/deploy`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setCollection(prev => prev ? { ...prev, contract_address: data.contractAddress } : null);
      } else {
        const data = await response.json();
        setCsvError(data.error || "デプロイに失敗しました");
      }
    } catch (error) {
      setCsvError("デプロイ中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const startDistribution = async () => {
    if (!collection || csvData.length === 0) return;

    try {
      setUploading(true);
      const response = await fetch(`/api/collections/${collection.id}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData }),
      });

      if (response.ok) {
        setCsvData([]);
        setActiveTab("logs");
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const data = await response.json();
        setCsvError(data.error || "配布の開始に失敗しました");
      }
    } catch (error) {
      setCsvError("配布の開始中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const handleIndividualMint = async () => {
    if (!collection) return;

    const walletInput = document.getElementById("individual-wallet") as HTMLInputElement;
    const nameInput = document.getElementById("individual-name") as HTMLInputElement;
    const tokenIdInput = document.getElementById("individual-token-id") as HTMLInputElement;

    const walletAddress = walletInput?.value.trim();
    const recipientName = nameInput?.value.trim();
    const tokenId = tokenIdInput?.value ? parseInt(tokenIdInput.value) : null;

    if (!walletAddress) {
      setCsvError("ウォレットアドレスを入力してください");
      return;
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setCsvError("有効なウォレットアドレスを入力してください");
      return;
    }

    setUploading(true);
    setCsvError("");

    try {
      const response = await fetch(`/api/collections/${collection.id}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: walletAddress,
          recipient_name: recipientName || null,
          token_id: tokenId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear form
        if (walletInput) walletInput.value = "";
        if (nameInput) nameInput.value = "";
        if (tokenIdInput) tokenIdInput.value = "";

        // Show success message
        setCsvError("");
        alert(`NFTのミントが完了しました！\nトークンID: ${data.nft.tokenId}\nトランザクション: ${data.nft.txHash}`);
        
        // Update collection's next token ID
        setCollection(prev => prev ? { ...prev, next_token_id: (prev.next_token_id || 1) + 1 } : null);
        
        // Refresh NFT history if logs tab is active
        if (activeTab === "logs") {
          fetchNFTHistory(collection.id);
        }
      } else {
        setCsvError(data.error || "ミントに失敗しました");
      }
    } catch (error) {
      console.error("Individual mint error:", error);
      setCsvError("ミント中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const handleFixBaseURI = async () => {
    if (!collection) return;

    setUploading(true);
    setCsvError("");

    try {
      const response = await fetch(`/api/collections/${collection.id}/fix-baseuri`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`BaseURIが正常に更新されました！\n新しいBaseURI: ${data.newBaseURI}\nトランザクション: ${data.txHash}`);
      } else {
        setCsvError(data.error || "BaseURIの更新に失敗しました");
      }
    } catch (error) {
      console.error("Fix BaseURI error:", error);
      setCsvError("BaseURI更新中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">コレクションが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/collections"
              className="mr-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
              <p className="text-gray-400 mt-1">コレクション管理</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8">
              {[
                { key: "info", label: "基本情報", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                { key: "distribute", label: "配布", icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" },
                { key: "logs", label: "ログ", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any);
                    if (tab.key === "logs" && collection?.id) {
                      fetchNFTHistory(collection.id);
                    }
                  }}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                    ${activeTab === tab.key
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">コレクション名</label>
                    <p className="text-white text-lg">{collection.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">シンボル</label>
                    <p className="text-white text-lg">{collection.symbol}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">説明</label>
                    <p className="text-gray-300">{collection.description || "説明なし"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ステータス</label>
                    <div className="flex items-center space-x-2">
                      {collection.contract_address ? (
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                          デプロイ済み
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-sm rounded-full">
                          未デプロイ
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">次のトークンID</label>
                    <p className="text-white text-lg">{collection.next_token_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">作成日</label>
                    <p className="text-gray-300">
                      {new Date(collection.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collection Image Display */}
              <div className="pt-6 border-t border-gray-800 space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">
                    {collection.contract_address ? "コレクション情報" : "デプロイ準備"}
                  </h4>
                  
                  {/* Image Display/Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      コレクション画像
                    </label>
                    {collection.image_ipfs ? (
                      <div className="flex items-center space-x-4">
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/${collection.image_ipfs}`}
                          alt="Collection"
                          className="w-32 h-32 rounded-lg object-cover border border-gray-700"
                          onError={(e) => {
                            console.error("Image loading failed:", e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-green-400 text-sm">✓ 画像アップロード完了</p>
                          <p className="text-gray-500 text-xs font-mono mb-2">{collection.image_ipfs}</p>
                          <a 
                            href={`https://gateway.pinata.cloud/ipfs/${collection.image_ipfs}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            直接画像を確認 →
                          </a>
                        </div>
                      </div>
                    ) : !collection.contract_address ? (
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <div className="mx-auto w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-white font-medium mb-2">画像をアップロード</p>
                          <p className="text-gray-400 text-sm">PNG, JPG, GIF (最大10MB)</p>
                        </label>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">画像がありません</p>
                    )}
                  </div>

              {/* Deploy Button Section */}
              {!collection.contract_address && (
                <div>
                  {/* Deploy Button */}
                  {collection.image_ipfs && (
                    <button
                      onClick={handleDeploy}
                      disabled={uploading}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          デプロイ中...
                        </div>
                      ) : (
                        "BSCにデプロイ"
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {collection.contract_address && (
                <div className="pt-6 border-t border-gray-800 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">コントラクトアドレス</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-sm bg-gray-800 px-3 py-2 rounded">
                        {collection.contract_address}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(collection.contract_address!)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">NFTメタデータ修正</label>
                    <p className="text-gray-400 text-sm mb-2">
                      MetaMaskで画像が表示されない場合は、コントラクトのbaseURIを修正してください
                    </p>
                    <button
                      onClick={handleFixBaseURI}
                      disabled={uploading}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {uploading ? "修正中..." : "BaseURIを修正"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "distribute" && (
            <div className="space-y-8">
              {/* Individual Mint Section */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">個別配布</h3>
                <p className="text-gray-400 mb-6">1つのNFTを指定したウォレットアドレスに送信</p>
                
                {!collection.contract_address && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-yellow-300">
                        配布を行うには、まず基本情報タブでコントラクトをデプロイしてください
                      </p>
                    </div>
                  </div>
                )}

                {collection.contract_address && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          ウォレットアドレス *
                        </label>
                        <input
                          type="text"
                          placeholder="0x..."
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          id="individual-wallet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          受取人名（任意）
                        </label>
                        <input
                          type="text"
                          placeholder="田中太郎"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          id="individual-name"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        NFT ID（任意：空白でランダム生成）
                      </label>
                      <input
                        type="number"
                        placeholder="例: 123"
                        className="w-full md:w-48 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        id="individual-token-id"
                      />
                    </div>
                    <button
                      onClick={handleIndividualMint}
                      disabled={uploading}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "ミント中..." : "NFTを送信"}
                    </button>
                  </div>
                )}
              </div>

              {/* CSV Batch Distribution Section */}
              <div className="border-t border-gray-800 pt-8">
                <h3 className="text-xl font-semibold text-white mb-4">CSV一括配布</h3>
                <p className="text-gray-400 mb-6">CSVファイルをアップロードしてNFTを一括配布</p>
              </div>

              {!collection.contract_address && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-yellow-300">
                      配布を行うには、まず基本情報タブでコントラクトをデプロイしてください
                    </p>
                  </div>
                </div>
              )}

              {collection.contract_address && (
                <>
                  {/* CSV Upload */}
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="mx-auto w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-white font-medium mb-2">CSVファイルをアップロード</p>
                      <p className="text-gray-400 text-sm">クリックしてファイルを選択</p>
                    </label>
                  </div>
                </>
              )}

              {collection.contract_address && (
                <>
                  {/* CSV Format Info */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">CSVフォーマット</h4>
                    <div className="text-sm text-blue-200 font-mono bg-blue-900/20 p-3 rounded">
                      wallet_address,collection_slug,quantity,recipient_name,distribution_date<br/>
                      0xAbc...,{collection.name},2,田中太郎,2025-07-15<br/>
                      0xDef...,{collection.name},1,SATO,2025-07-15
                    </div>
                  </div>

                  {csvError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-300">{csvError}</p>
                      </div>
                    </div>
                  )}

                  {/* CSV Preview */}
                  {csvData.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-4">プレビュー ({csvData.length}件)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left p-3 text-gray-300">ウォレットアドレス</th>
                              <th className="text-left p-3 text-gray-300">数量</th>
                              <th className="text-left p-3 text-gray-300">受取人</th>
                              <th className="text-left p-3 text-gray-300">配布日</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 5).map((row, index) => (
                              <tr key={index} className="border-b border-gray-800">
                                <td className="p-3 text-gray-300 font-mono text-xs">
                                  {row.wallet_address.slice(0, 6)}...{row.wallet_address.slice(-4)}
                                </td>
                                <td className="p-3 text-white">{row.quantity}</td>
                                <td className="p-3 text-gray-300">{row.recipient_name}</td>
                                <td className="p-3 text-gray-300">{row.distribution_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {csvData.length > 5 && (
                          <p className="text-gray-400 text-sm p-3">...他 {csvData.length - 5} 件</p>
                        )}
                      </div>
                      
                      <button
                        onClick={startDistribution}
                        disabled={uploading}
                        className="mt-4 w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            配布開始中...
                          </div>
                        ) : (
                          "配布を開始"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">配布履歴</h3>
                  <p className="text-gray-400 mb-6">ミントされたNFTの一覧</p>
                </div>
                {nftHistory.length > 0 && (
                  <button
                    onClick={() => {
                      window.open(`/api/collections/${collection?.id}/export`, '_blank');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>CSVダウンロード</span>
                  </button>
                )}
              </div>
              
              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">履歴を読み込み中...</p>
                </div>
              ) : nftHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">配布履歴がありません</h3>
                  <p className="text-gray-400">まだNFTがミントされていません</p>
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900/50">
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-4 text-gray-300">NFT ID</th>
                          <th className="text-left p-4 text-gray-300">ウォレットアドレス</th>
                          <th className="text-left p-4 text-gray-300">受取人</th>
                          <th className="text-left p-4 text-gray-300">ミント日時</th>
                          <th className="text-left p-4 text-gray-300">トランザクション</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nftHistory.map((nft, index) => (
                          <tr key={nft.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                            <td className="p-4 text-white font-mono font-bold">
                              #{nft.token_id}
                            </td>
                            <td className="p-4 text-gray-300 font-mono text-xs">
                              {nft.owner_address.slice(0, 6)}...{nft.owner_address.slice(-4)}
                            </td>
                            <td className="p-4 text-gray-300">
                              {nft.recipient_name || '-'}
                            </td>
                            <td className="p-4 text-gray-300">
                              {nft.minted_at ? new Date(nft.minted_at).toLocaleString('ja-JP') : '-'}
                            </td>
                            <td className="p-4">
                              {nft.tx_hash ? (
                                <a
                                  href={`https://bscscan.com/tx/${nft.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 font-mono text-xs"
                                >
                                  {nft.tx_hash.slice(0, 10)}...
                                </a>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">
                      合計 {nftHistory.length} 個のNFTが配布されました
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}