import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ethers } from "ethers";
import { getWallet } from "@/lib/blockchain";
import CollectionABI from "@/contracts/Collection.json";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    if (!collection.contract_address) {
      return NextResponse.json(
        { error: "コントラクトがデプロイされていません" },
        { status: 400 }
      );
    }

    // Fix the baseURI with proper trailing slash
    const newBaseURI = `https://bscnf-tdistribution.vercel.app/api/collections/${id}/metadata/`;
    
    console.log("Updating contract baseURI to:", newBaseURI);

    // Update the contract's baseURI
    const wallet = getWallet();
    const contract = new ethers.Contract(
      collection.contract_address,
      CollectionABI.abi,
      wallet
    );

    const tx = await contract.setBaseURI(newBaseURI);
    const receipt = await tx.wait();

    console.log("BaseURI updated successfully:", receipt.hash);

    return NextResponse.json({
      success: true,
      message: "BaseURIが正常に更新されました",
      newBaseURI,
      txHash: receipt.hash
    });

  } catch (error) {
    console.error("Fix baseURI error:", error);
    return NextResponse.json(
      { error: `BaseURIの更新に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}