/**
 * Formulaire Produit Admin - AVEC UPLOAD IMAGE
 * @description Création et édition de produits
 * 
 * ✅ AJOUT: Composant ImageUploader avec deux options (upload local / URL externe)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Package,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Eye,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import ImageUploader from '../../components/admin/ImageUploader';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // États
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  // Données du formulaire
  const [formData, setFormData] = useState({
    reference: '',
    nom: '',
    slug: '',
    description: '',
    categorieId: '',
    prix: '',
    prixPromo: '',
    tauxTva: '5.50',
    uniteMesure: 'kg',
    stockQuantite: '0',
    stockMinAlerte: '10',
    imageUrl: '',
    labels: [],
    origine: 'France',
    estActif: true,
    estMisEnAvant: false
  });

  // Labels disponibles
  const availableLabels = [
    { value: 'BIO', label: 'Bio', icon: '🌱', color: 'green' },
    { value: 'LOCAL', label: 'Local', icon: '📍', color: 'blue' },
    { value: 'PROMO', label: 'Promo', icon: '🏷️', color: 'red' },
    { value: 'NOUVEAU', label: 'Nouveau', icon: '✨', color: 'purple' },
    { value: 'AOP', label: 'AOP', icon: '🏅', color: 'amber' },
    { value: 'AOC', label: 'AOC', icon: '🏅', color: 'amber' },
    { value: 'LABEL_ROUGE', label: 'Label Rouge', icon: '🔴', color: 'red' }
  ];

  // Unités de mesure
  const unites = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'litre', label: 'Litre (L)' },
    { value: 'piece', label: 'Pièce' },
    { value: 'unite', label: 'Unité' }
  ];

  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getAll();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    };
    loadCategories();
  }, []);

  // Charger le produit en mode édition
  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        setLoading(true);
        try {
          const response = await productService.getById(id);
          if (response.success) {
            const p = response.data;
            setFormData({
              reference: p.reference || '',
              nom: p.nom || '',
              slug: p.slug || '',
              description: p.description || '',
              categorieId: p.categorieId || '',
              prix: p.prix?.toString() || '',
              prixPromo: p.prixPromo?.toString() || '',
              tauxTva: p.tauxTva?.toString() || '5.50',
              uniteMesure: p.uniteMesure || 'kg',
              stockQuantite: p.stockQuantite?.toString() || '0',
              stockMinAlerte: p.stockMinAlerte?.toString() || '10',
              imageUrl: p.imageUrl || '',
              labels: p.labels || [],
              origine: p.origine || 'France',
              estActif: p.estActif !== false,
              estMisEnAvant: p.estMisEnAvant || false
            });
          }
        } catch (err) {
          console.error('Erreur chargement produit:', err);
          toast.error('Produit non trouvé');
          navigate('/admin/produits');
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, isEdit, navigate]);

  // Générer le slug à partir du nom
  const generateSlug = (nom) => {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    // Auto-générer le slug si on modifie le nom
    if (name === 'nom' && !isEdit) {
      setFormData(prev => ({
        ...prev,
        nom: value,
        slug: generateSlug(value)
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Effacer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // ✅ Handler pour l'image (URL ou upload)
  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  const handleLabelToggle = (label) => {
    setFormData(prev => {
      const labels = prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label];
      return { ...prev, labels };
    });
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.reference.trim()) {
      newErrors.reference = 'La référence est requise';
    }
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Le slug est requis';
    }
    if (!formData.categorieId) {
      newErrors.categorieId = 'La catégorie est requise';
    }
    if (!formData.prix || parseFloat(formData.prix) <= 0) {
      newErrors.prix = 'Le prix doit être supérieur à 0';
    }
    if (formData.prixPromo && parseFloat(formData.prixPromo) >= parseFloat(formData.prix)) {
      newErrors.prixPromo = 'Le prix promo doit être inférieur au prix';
    }
    if (parseInt(formData.stockQuantite) < 0) {
      newErrors.stockQuantite = 'Le stock ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setSaving(true);

    try {
      const data = {
        reference: formData.reference,
        nom: formData.nom,
        slug: formData.slug,
        description: formData.description,
        categorieId: formData.categorieId,
        prix: parseFloat(formData.prix),
        prixPromo: formData.prixPromo ? parseFloat(formData.prixPromo) : null,
        tauxTva: parseFloat(formData.tauxTva),
        uniteMesure: formData.uniteMesure,
        stockQuantite: parseInt(formData.stockQuantite),
        stockMinAlerte: parseInt(formData.stockMinAlerte),
        imageUrl: formData.imageUrl || null,
        labels: formData.labels,
        origine: formData.origine,
        estActif: formData.estActif,
        estMisEnAvant: formData.estMisEnAvant
      };

      let response;
      if (isEdit) {
        response = await productService.update(id, data);
      } else {
        response = await productService.create(data);
      }

      if (response.success) {
        toast.success(isEdit ? 'Produit mis à jour !' : 'Produit créé !');
        navigate('/admin/produits');
      } else {
        toast.error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/produits"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
            </h1>
            <p className="text-gray-500">
              {isEdit ? `Modification de ${formData.nom}` : 'Créer un nouveau produit'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {isEdit && (
            <Link
              to={`/produit/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Voir
            </Link>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" />
            Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Référence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence *
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Ex: FRL-001"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.reference ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.reference && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reference}
                </p>
              )}
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                name="categorieId"
                value={formData.categorieId}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${
                  errors.categorieId ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icone} {cat.nom}
                  </option>
                ))}
              </select>
              {errors.categorieId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.categorieId}
                </p>
              )}
            </div>

            {/* Nom */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Pommes Gala Bio"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.nom ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.nom && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nom}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">/produit/</span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="pommes-gala-bio"
                  className={`flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.slug ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.slug}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Description du produit..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {/* Origine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origine
              </label>
              <input
                type="text"
                name="origine"
                value={formData.origine}
                onChange={handleChange}
                placeholder="Ex: France"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </motion.div>

        {/* ✅ NOUVELLE SECTION: Image du produit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-400" />
            Image du produit
          </h2>

          <ImageUploader
            value={formData.imageUrl}
            onChange={handleImageChange}
            onError={(msg) => toast.error(msg)}
          />
        </motion.div>

        {/* Prix et Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            💰 Prix et Stock
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (€) *
              </label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.prix ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.prix && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.prix}
                </p>
              )}
            </div>

            {/* Prix Promo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix promo (€)
              </label>
              <input
                type="number"
                name="prixPromo"
                value={formData.prixPromo}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Laisser vide si pas de promo"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.prixPromo ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.prixPromo && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.prixPromo}
                </p>
              )}
            </div>

            {/* TVA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux TVA (%)
              </label>
              <select
                name="tauxTva"
                value={formData.tauxTva}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="5.50">5.5% (Alimentaire)</option>
                <option value="10.00">10%</option>
                <option value="20.00">20% (Standard)</option>
              </select>
            </div>

            {/* Unité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unité de mesure
              </label>
              <select
                name="uniteMesure"
                value={formData.uniteMesure}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {unites.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité en stock
              </label>
              <input
                type="number"
                name="stockQuantite"
                value={formData.stockQuantite}
                onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.stockQuantite ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>

            {/* Seuil d'alerte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil d'alerte stock
              </label>
              <input
                type="number"
                name="stockMinAlerte"
                value={formData.stockMinAlerte}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Labels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🏷️ Labels et Certifications
          </h2>

          <div className="flex flex-wrap gap-2">
            {availableLabels.map(({ value, label, icon, color }) => {
              const isActive = formData.labels.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleLabelToggle(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                    isActive
                      ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ⚙️ Options
          </h2>

          <div className="space-y-4">
            {/* Est actif */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="estActif"
                checked={formData.estActif}
                onChange={handleChange}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-800">Produit actif</p>
                <p className="text-sm text-gray-500">Le produit est visible sur le site</p>
              </div>
            </label>

            {/* Mis en avant */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="estMisEnAvant"
                checked={formData.estMisEnAvant}
                onChange={handleChange}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-800">Mis en avant</p>
                <p className="text-sm text-gray-500">Afficher en page d'accueil</p>
              </div>
            </label>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/produits"
            className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
