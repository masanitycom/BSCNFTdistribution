import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { uploadToIPFS, uploadJSONToIPFS, getIPFSProtocolUrl } from "@/lib/ipfs";
import formidable from "formidable";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    console.log("Upload image API called for collection:", id);

    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    console.log("Session valid, processing form data...");

    const formData = await request.formData();
    const file = formData.get("image") as File;
    
    console.log("File received:", {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });

    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      );
    }

    // Get collection
    console.log("Fetching collection...");
    const { data: collection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (!collection) {
      console.log("Collection not found");
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    console.log("Collection found:", collection.name);

    // Check environment variables
    if (!process.env.PINATA_JWT) {
      console.error("PINATA_JWT not configured");
      return NextResponse.json(
        { error: "IPFS設定が不正です" },
        { status: 500 }
      );
    }

    console.log("Uploading to IPFS...");

    // Upload image to IPFS
    const imageHash = await uploadToIPFS(file, {
      name: `${collection.name}_image`,
      keyvalues: {
        collection_id: id,
        type: "image"
      }
    });

    console.log("Image uploaded to IPFS:", imageHash);

    // Create metadata JSON - use HTTPS gateway for better MetaMask compatibility
    const metadata = {
      name: collection.name,
      description: collection.description || "",
      image: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
      attributes: []
    };

    console.log("Uploading metadata to IPFS...");

    // Upload metadata to IPFS
    const metadataHash = await uploadJSONToIPFS(metadata, {
      name: `${collection.name}_metadata`,
      keyvalues: {
        collection_id: id,
        type: "metadata"
      }
    });

    console.log("Metadata uploaded to IPFS:", metadataHash);

    // Update collection with IPFS hash
    console.log("Updating collection in database...");
    const { error: updateError } = await supabase
      .from("collections")
      .update({ 
        image_ipfs: imageHash,
        metadata_ipfs: metadataHash
      })
      .eq("id", id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    console.log("Upload complete!");

    return NextResponse.json({
      success: true,
      imageHash,
      metadataHash,
      baseURI: getIPFSProtocolUrl(metadataHash)
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}