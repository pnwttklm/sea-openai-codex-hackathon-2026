const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export async function prepareSelfie(file: File): Promise<Blob> {
  if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG, or WebP photo up to 10 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot prepare the photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not prepare the photo."));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
