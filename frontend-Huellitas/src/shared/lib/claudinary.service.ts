// src/shared/services/cloudinary.service.ts

export const cloudinaryService = {
  /**
   * Sube un archivo físico a Cloudinary y retorna la URL pública
   */
  uploadFile: async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Faltan las variables de entorno de Cloudinary en el frontend.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Error al subir el archivo a Cloudinary");
      }

      const data = await response.json();
      // Retornamos directamente el string de la URL segura
      return data.secure_url; 
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
    }
  },
};