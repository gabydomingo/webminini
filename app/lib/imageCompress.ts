// Comprime y redimensiona una imagen en el navegador antes de subirla a Storage.
// Evita que fotos de cámara/celular (varios MB cada una) infraten el storage de Supabase.

export async function compressImage(
    file: File,
    maxWidth = 1920,
    quality = 0.8
): Promise<File> {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
        return file;
    }

    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob || blob.size >= file.size) {
        return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
}
