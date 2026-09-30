import { useState, useRef } from "react";
import { uploadImage } from "../../api/uploadApi";

const ProfileImageUpload = ({ currentImage, onImageUpload, name }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    // Validate type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/i)) {
      setError("Only image files are allowed");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const { data } = await uploadImage(formData);
      onImageUpload(data.url); // Call parent handler with the new URL
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        
        {/* Avatar Preview */}
        <div
          style={{
            width: "80px", height: "80px", borderRadius: "50%",
            backgroundColor: "var(--color-surface-2)",
            background: !currentImage ? "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", fontWeight: 700, color: "#fff",
            overflow: "hidden", position: "relative",
            border: "2px solid var(--color-surface-2)",
            flexShrink: 0
          }}
        >
          {uploading ? (
            <div style={{ fontSize: "14px", animation: "spin 1s linear infinite" }}>⏳</div>
          ) : currentImage ? (
            <img src={currentImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>

        {/* Upload Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--color-primary)",
              backgroundColor: "rgba(99,102,241,0.1)", color: "var(--color-primary-light)",
              fontSize: "13px", fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer",
              fontFamily: "inherit", width: "fit-content"
            }}
          >
            {uploading ? "Uploading..." : currentImage ? "Change Image" : "Upload Image"}
          </button>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            JPG, PNG or WebP. Max 5MB.
          </span>
        </div>
      </div>
      
      {error && (
        <div style={{ fontSize: "12px", color: "#fca5a5" }}>⚠️ {error}</div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
