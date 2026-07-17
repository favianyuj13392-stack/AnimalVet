// src/shared/services/cloudinary.service.ts

export const cloudinaryService = {
  /**
   * Sube un archivo físico a Cloudinary y retorna la URL pública.
   * Si no está configurado (variables por defecto de desarrollo) o la subida falla,
   * se aplica fallback leyendo el archivo como Data URL Base64 para que el
   * sistema funcione localmente de manera impecable.
   */
  uploadFile: async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Si tiene las credenciales por defecto del .env local, usamos fallback a Base64
    if (
      !cloudName ||
      !uploadPreset ||
      cloudName === "tu_cloud_name" ||
      uploadPreset === "tu_upload_preset"
    ) {
      console.warn("Cloudinary no configurado en .env (tu_cloud_name / tu_upload_preset). Usando conversión Base64 local como fallback.");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
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
        throw new Error("Fallo la respuesta del servidor de Cloudinary");
      }

      const data = await response.json();
      return data.secure_url; 
    } catch (error) {
      console.warn("Fallo la subida a Cloudinary, aplicando fallback local Base64. Error:", error);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  },
};