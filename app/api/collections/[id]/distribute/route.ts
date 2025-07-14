import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

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

    const { csvData } = await request.json();

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json(
        { error: "CSVデータが無効です" },
        { status: 400 }
      );
    }

    // Check if collection exists
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

    // Create distribution job
    const { data: job, error: jobError } = await supabase
      .from("distribution_jobs")
      .insert({
        collection_id: id,
        csv_original: csvData,
        status: "PENDING",
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error("Job creation error:", jobError);
      return NextResponse.json(
        { error: "配布ジョブの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      job_id: job.id,
      message: "配布ジョブが開始されました" 
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}