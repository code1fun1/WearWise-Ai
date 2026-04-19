import { v2 as cloudinary } from "cloudinary";

// Configure once — safe to call multiple times (idempotent)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64-encoded image to Cloudinary.
 *
 * @param {string} base64Image  - Raw base64 string (no data-URI prefix)
 * @param {string} mimeType     - e.g. "image/jpeg"
 * @param {string} folder       - Cloudinary folder (default: "wardrobe")
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadImage(base64Image, mimeType, folder = "wardrobe") {
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    // Auto-generate a unique public_id
    use_filename: false,
    unique_filename: true,
    // Optimise on the fly
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Used when user removes a clothing item.
 *
 * @param {string} publicId
 */
export async function deleteImage(publicId) {
  await cloudinary.uploader.destroy(publicId);
}
