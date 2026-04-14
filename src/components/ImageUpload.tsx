"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { 
  Upload, 
  X, 
  Check, 
  Image as ImageIcon, 
  Maximize, 
  Square, 
  Crop,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  value: string;
  onChange: (base64: string) => void;
  aspectRatio?: number; // 1 for 1:1, 1.33 for 4:3
}

export default function ImageUpload({ value, onChange, aspectRatio = 1 }: ImageUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("👉 Please upload JPG, PNG or WEBP format.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("👉 Image must be less than 5MB");
      return;
    }

    setError(null);
    setLoading(true);

    // 2. Read file
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
      setIsCropping(true);
      setLoading(false);
    });
    reader.readAsDataURL(file);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<string | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const handleCropSave = async () => {
    try {
      setLoading(true);
      const croppedBase64 = await getCroppedImg(imageSrc!, croppedAreaPixels);
      
      if (croppedBase64) {
        // 3. Compression
        const blob = await fetch(croppedBase64).then((r) => r.blob());
        const options = {
          maxSizeMB: 0.8, // Aim for under 1MB
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(blob as File, options);
        
        const finalBase64 = await imageCompression.getDataUrlFromFile(compressedFile);
        onChange(finalBase64);
        setIsCropping(false);
        setImageSrc(null);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to process image.");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="image-upload-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
      />

      {value ? (
        <div className="preview-wrap">
          <img src={value} alt="Dish Preview" className="main-preview" />
          <div className="preview-overlay">
            <button 
              type="button" 
              className="action-btn remove" 
              onClick={removeImage}
              title="Remove image"
            >
              <X size={18} />
            </button>
            <button 
              type="button" 
              className="action-btn change" 
              onClick={() => fileInputRef.current?.click()}
              title="Change image"
            >
              <Upload size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`upload-placeholder ${error ? 'has-error' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          ) : (
            <>
              <div className="icon-circle">
                <Upload size={24} />
              </div>
              <div className="upload-text">
                <span className="main-label">Upload Dish Image</span>
                <span className="sub-label">Click to select or drag & drop</span>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="upload-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="upload-guidelines">
        <p className="guideline-note">
          <strong>Recommended:</strong> Aspect Ratio {aspectRatio === 1 ? '1:1 (Square)' : '4:3'} • {aspectRatio === 1 ? '800×800' : '800×600'}px • JPG/PNG/WEBP • Max 5MB
        </p>
      </div>

      <AnimatePresence>
        {isCropping && (
          <div className="modal-root">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="crop-modal"
            >
              <div className="crop-header">
                <h3>Crop & Refine</h3>
                <button type="button" onClick={() => setIsCropping(false)} className="close-btn">
                  <X size={20} />
                </button>
              </div>
              
              <div className="crop-container">
                <Cropper
                  image={imageSrc!}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="crop-footer">
                <div className="zoom-slider-wrap">
                  <label>Zoom</label>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="zoom-range"
                  />
                </div>
                <div className="crop-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setIsCropping(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleCropSave}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    <span>Apply Crop</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .image-upload-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .upload-placeholder {
          width: 100%;
          aspect-ratio: 16/9;
          background: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: #64748b;
        }

        .upload-placeholder:hover {
          border-color: var(--primary);
          background: #fef2f2;
          color: var(--primary);
        }

        .upload-placeholder.has-error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }

        .upload-text {
          text-align: center;
        }

        .main-label {
          display: block;
          font-weight: 800;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .sub-label {
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0.8;
        }

        .preview-wrap {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
          border: 1px solid var(--border);
          background: #f1f5f9;
        }

        .main-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          opacity: 0;
          transition: all 0.2s;
        }

        .preview-wrap:hover .preview-overlay {
          opacity: 1;
        }

        .action-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.remove { background: #fee2e2; color: #ef4444; }
        .action-btn.remove:hover { background: #ef4444; color: white; }
        .action-btn.change { background: white; color: #0f172a; }
        .action-btn.change:hover { transform: scale(1.1); }

        .upload-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          color: #ef4444;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid #fee2e2;
        }

        .guideline-note {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          padding: 0 0.5rem;
          line-height: 1.4;
        }

        /* MODAL */
        .modal-root {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1.5rem;
        }

        .modal-backdrop {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
        }

        .crop-modal {
          position: relative;
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          z-index: 10001;
        }

        .crop-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .crop-header h3 { font-size: 1.125rem; font-weight: 800; margin: 0; }
        .close-btn { background: #f8fafc; border: none; padding: 0.4rem; border-radius: 0.5rem; cursor: pointer; color: #94a3b8; }

        .crop-container {
          position: relative;
          height: 350px;
          background: #0f172a;
        }

        .crop-footer {
          padding: 1.5rem;
          background: white;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .zoom-slider-wrap {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .zoom-slider-wrap label { font-size: 0.875rem; font-weight: 800; color: #64748b; }
        .zoom-range { flex: 1; accent-color: var(--primary); }

        .crop-actions {
          display: flex;
          gap: 1rem;
        }

        .crop-actions button { flex: 1; }
      `}</style>
    </div>
  );
}
