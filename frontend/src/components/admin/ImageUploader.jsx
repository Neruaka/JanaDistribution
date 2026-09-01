/**
 * Composant ImageUploader
 * @description Upload d'image locale OU URL externe
 */

import { useState, useRef } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  X, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';

const ImageUploader = ({ 
  value, 
  onChange, 
  onError,
  className = ''
}) => {
  // Mode: 'upload' ou 'url'
  const [mode, setMode] = useState(value?.startsWith('/uploads') ? 'upload' : 'url');
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value?.startsWith('http') ? value : '');
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  // URL de base pour les images locales
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  /**
   * Gère l'upload d'un fichier
   */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation côté client
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux. Maximum 5 MB.');
      return;
    }

    setIsUploading(true);
    setPreviewError(false);

    try {
      const response = await productService.uploadImage(file);
      
      if (response.success) {
        onChange(response.data.imageUrl);
        toast.success('Image uploadée !');
      } else {
        throw new Error(response.message || 'Erreur upload');
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      toast.error(err.message || 'Erreur lors de l\'upload');
      onError?.(err.message);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Applique l'URL externe
   */
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      onChange('');
      return;
    }

    // Validation basique de l'URL
    try {
      new URL(urlInput);
      onChange(urlInput);
      setPreviewError(false);
      toast.success('URL de l\'image enregistrée');
    } catch {
      toast.error('URL invalide');
    }
  };

  /**
   * Supprime l'image actuelle
   */
  const handleRemove = async () => {
    // Si c'est une image locale uploadée, la supprimer du serveur
    if (value?.startsWith('/uploads/products/')) {
      const filename = value.split('/uploads/products/').pop();
      try {
        await productService.deleteImage(filename);
      } catch (err) {
        console.error('Erreur suppression image:', err);
      }
    }

    onChange('');
    setUrlInput('');
    setPreviewError(false);
  };

  /**
   * Construit l'URL complète pour l'aperçu
   */
  const getPreviewUrl = () => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    if (value.startsWith('/uploads')) return `${API_URL}${value}`;
    return value;
  };

  const previewUrl = getPreviewUrl();

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Tabs de sélection du mode */}
      <div className="flex gap-1 p-1 bg-sand-100 rounded-6 w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-5 text-[12.5px] font-semibold transition-colors ${
            mode === 'upload' ? 'bg-white text-green-700 shadow-sm' : 'text-graphite-500 hover:text-ink-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Depuis mon PC
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-5 text-[12.5px] font-semibold transition-colors ${
            mode === 'url' ? 'bg-white text-green-700 shadow-sm' : 'text-graphite-500 hover:text-ink-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          URL externe
        </button>
      </div>

      {/* Aperçu ou zone de dépôt */}
      {value ? (
        <div className="relative group">
          <div className="relative overflow-hidden rounded-8 border-2 border-green-700 bg-sand-50 h-[150px]">
            {previewError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-graphite-300 gap-1.5 px-4 text-center">
                <AlertCircle className="w-5 h-5" />
                <span className="text-[12px]">Aperçu indisponible</span>
              </div>
            ) : (
              <img src={previewUrl} alt="Aperçu" className="w-full h-full object-contain" onError={() => setPreviewError(true)} />
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-danger-text text-white rounded-5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-graphite-400">
            <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{value.startsWith('/uploads') ? `Fichier local : ${value.split('/').pop()}` : 'URL externe'}</span>
          </div>
        </div>
      ) : mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-[150px] border border-dashed border-[#D6D2C6] rounded-8 hover:border-green-700 hover:bg-sand-50 transition-colors disabled:opacity-50"
          >
            <div className="flex flex-col items-center gap-1.5 text-graphite-400">
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-green-700" />
                  <span className="text-[12.5px]">Upload en cours…</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  <span className="text-[13px] font-medium text-graphite-600">Cliquer pour choisir une image</span>
                  <span className="font-mono text-[11px] text-graphite-300">JPG, PNG, WebP, GIF · Max 5 Mo</span>
                </>
              )}
            </div>
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://exemple.com/image.jpg"
            className="flex-1 border border-sand-250 rounded-6 h-11 px-3.5 text-[13.5px] text-ink-900 focus:outline-none focus:border-ink-900"
          />
          <button type="button" onClick={handleUrlSubmit} className="w-11 h-11 flex items-center justify-center bg-green-700 hover:bg-green-800 text-white rounded-6 transition-colors flex-shrink-0">
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
