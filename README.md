# BSC NFT Distribution System

Binance Smart Chain上でNFTコレクションを作成し、CSVファイルを使用してワンクリックで配布できるWebアプリケーション。

## 技術スタック

- **Frontend**: Next.js 13 (App Router) + TypeScript
- **Smart Contract**: Solidity + OpenZeppelin ERC721
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Binance Smart Chain (BSC)
- **Styling**: Tailwind CSS (Dark Theme)
- **IPFS**: Pinata Gateway

## セットアップ

### 1. 環境変数の設定

`.env.example`を`.env.local`にコピーして、必要な値を設定してください：

```bash
cp .env.example .env.local
```

### 2. パスワードハッシュの生成

管理者パスワードのハッシュを生成：

```bash
node scripts/generate-password-hash.js your-password
```

生成されたハッシュを`.env.local`の`ADMIN_PASSWORD_HASH`に設定。

### 3. Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで`supabase/migrations/00001_initial_schema.sql`を実行
3. プロジェクトのURLとAnon Keyを`.env.local`に設定

### 4. スマートコントラクトのデプロイ

```bash
# BSC Testnet
npx hardhat run scripts/deploy.ts --network bsctest

# BSC Mainnet
npx hardhat run scripts/deploy.ts --network bsc
```

### 5. ローカル開発

```bash
npm install
npm run dev
```

## Vercelへのデプロイ

1. [Vercel](https://vercel.com)でこのリポジトリをインポート
2. 環境変数を設定（`.env.local`の内容をVercelの環境変数に追加）
3. デプロイ

## 機能

- 管理者認証システム
- NFTコレクションの作成と管理
- CSVファイルによる一括配布
- 配布ジョブの進行状況追跡
- パブリックギャラリー
- BSC Testnet/Mainnet切り替え対応

## ライセンス

MIT