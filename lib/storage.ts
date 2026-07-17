"use client";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export const isStorageConfigured = supabaseConfigured;

const BUCKET = "assets";

// Redimensiona/comprime en cliente y devuelve un Blob JPEG.
async function shrink(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("No se pudo comprimir la imagen.");
  return blob;
}

// Sube <folder>/<filename>.jpg y devuelve la URL pública. upsert para resubir.
export async function uploadImage(folder: string, filename: string, file: File, maxWidth: number): Promise<string> {
  if (!supabaseConfigured) throw new Error("Storage no configurado.");
  const supabase = createClient();
  const blob = await shrink(file, maxWidth);
  const path = `${folder}/${filename}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error(`Error al subir: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust para que la URL cambie tras un re-upload a la misma ruta.
  return `${data.publicUrl}?v=${Date.now()}`;
}
