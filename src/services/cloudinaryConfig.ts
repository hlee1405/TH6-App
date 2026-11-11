/**
 * Cấu hình Cloudinary (Dùng Unsigned Upload Preset - Không lưu API Secret trong mã nguồn)
 * Bạn có thể thay thế bằng cloud_name và upload_preset của bạn trên Cloudinary Dashboard.
 */
export const CLOUDINARY_CONFIG = {
  cloudName: 'dugoc2d9l', // Thay bằng cloud_name Cloudinary của bạn
  uploadPreset: 'connect_chat_preset', // Tên unsigned upload preset đã cấu hình trên Cloudinary
};

