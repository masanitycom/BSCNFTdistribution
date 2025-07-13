import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AdminUser = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type Collection = {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image_ipfs?: string;
  contract_address?: string;
  next_token_id: number;
  created_at: string;
};

export type NFT = {
  id: string;
  collection_id: string;
  token_id: number;
  owner_address: string;
  minted_at: string;
  tx_hash?: string;
};

export type DistributionJob = {
  id: string;
  collection_id: string;
  csv_original: any;
  status: "PENDING" | "RUNNING" | "DONE" | "ERROR";
  log?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
};