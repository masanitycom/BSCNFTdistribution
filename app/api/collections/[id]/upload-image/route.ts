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
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      );
    }

    // Get collection
    const { data: collection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (!collection) {
      return NextResponse.json(
        { error: "コレクションが見つかりません" },
        { status: 404 }
      );
    }

    // Upload image to IPFS
    const imageHash = await uploadToIPFS(file, {
      name: `${collection.name}_image`,
      keyvalues: {
        collection_id: id,
        type: "image"
      }
    });

    // Create metadata JSON
    const metadata = {
      name: collection.name,
      description: collection.description || "",
      image: getIPFSProtocolUrl(imageHash),
      attributes: []
    };

    // Upload metadata to IPFS
    const metadataHash = await uploadJSONToIPFS(metadata, {
      name: `${collection.name}_metadata`,
      keyvalues: {
        collection_id: id,
        type: "metadata"
      }
    });

    // Update collection with IPFS hash
    const { error: updateError } = await supabase
      .from("collections")
      .update({ 
        image_ipfs: imageHash,
        metadata_ipfs: metadataHash
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      imageHash,
      metadataHash,
      baseURI: getIPFSProtocolUrl(metadataHash)
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}