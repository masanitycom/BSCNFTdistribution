import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { supabase } from "./supabase";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await supabase.from("sessions").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  const { data: session } = await supabase
    .from("sessions")
    .select("*, admin_users(*)")
    .eq("token", token)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session;
}

export async function logout() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    await supabase.from("sessions").delete().eq("token", token);
    cookieStore.delete("session");
  }
}