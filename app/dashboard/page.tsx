import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/collections/new" className="block">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <h2 className="text-xl font-semibold mb-2">新しいコレクション作成</h2>
              <p className="text-gray-400">NFTコレクションを作成してデプロイ</p>
            </div>
          </Link>
          
          <Link href="/collections" className="block">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <h2 className="text-xl font-semibold mb-2">コレクション一覧</h2>
              <p className="text-gray-400">既存のコレクションを管理</p>
            </div>
          </Link>
          
          <Link href="/gallery" className="block">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <h2 className="text-xl font-semibold mb-2">パブリックギャラリー</h2>
              <p className="text-gray-400">発行済みNFTを閲覧</p>
            </div>
          </Link>
          
          <Link href="/settings" className="block">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <h2 className="text-xl font-semibold mb-2">設定</h2>
              <p className="text-gray-400">システム設定とネットワーク切り替え</p>
            </div>
          </Link>
        </div>
        
        <div className="mt-8 flex justify-end">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}