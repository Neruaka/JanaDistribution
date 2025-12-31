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
    <div className={`space-y-4 ${className}`}>
      {/* Tabs de sélection du mode */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          Depuis mon PC
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          URL externe
        </button>
      </div>

      {/* Mode Upload */}
      {mode === 'upload' && (
        <div className="space-y-3">
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
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <span className="font-medium">Cliquer pour choisir une image</span>
                  <span className="text-xs text-gray-400">
                    JPG, PNG, WebP, GIF • Max 5 MB
                  </span>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Mode URL */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Aperçu de l'image */}
      {value && (
        <div className="relative group">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {previewError ? (
              <div className="w-full h-48 flex flex-col items-center justify-center text-gray-400">
                <AlertCircle className="w-8 h-8 mb-2" />
                <span className="text-sm">Impossible de charger l'aperçu</span>
                <span className="text-xs text-gray-400 mt-1 break-all px-4">
                  {value}
                </span>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Aperçu"
                className="w-full h-48 object-contain"
                onError={() => setPreviewError(true)}
              />
            )}
            
            {/* Bouton supprimer */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info fichier */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <ImageIcon className="w-4 h-4" />
            <span className="truncate">
              {value.startsWith('/uploads') 
                ? `Fichier local: ${value.split('/').pop()}`
                : 'URL externe'
              }
            </span>
          </div>
        </div>
      )}

      {/* Placeholder si pas d'image */}
      {!value && !isUploading && (
        <div className="w-full h-32 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Aucune image</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
