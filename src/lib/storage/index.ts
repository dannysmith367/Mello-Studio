import { SupabaseStorage } from "./supabase";
import type { StorageProvider } from "./types";

export const storage: StorageProvider = new SupabaseStorage();
export * from "./types";
