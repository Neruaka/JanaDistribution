/**
 * Formulaire Produit Admin
 * @description Ecran A5 — Fiche produit (edition)
 * @see design_handoff_jana_refonte/README.md (A5 — Fiche produit / edition)
 *
 * La maquette prevoit brouillon auto / Publier, sous-rayon, tarifs degressifs
 * editables, contenu du colis, conservation, titre meta et une galerie de 4
 * photos. Aucun de ces elements n'a d'equivalent dans le schema produit
 * (colonnes reelles : reference/nom/slug/description/prix/prixPromo/tauxTva/
 * uniteMesure/stockQuantite/stockMinAlerte/imageUrl unique/labels/origine/
 * categorie a plat sans sous-niveau/estActif/estMisEnAvant) : ils sont omis
 * plutot que fabriques. "Aperçu" reprend le vrai lien vers la fiche client.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import ImageUploader from '../../components/admin/ImageUploader';
import Toggle from '../../components/Toggle';

const AVAILABLE_LABELS = [
  { value: 'BIO', label: 'Bio', tone: 'success' },
  { value: 'PROMO', label: 'Promo', tone: 'warning' },
  { value: 'LOCAL', label: 'Local', tone: 'neutral' },
  { value: 'NOUVEAU', label: 'Nouveau', tone: 'neutral' },
  { value: 'AOP', label: 'AOP', tone: 'neutral' },
  { value: 'AOC', label: 'AOC', tone: 'neutral' },
  { value: 'LABEL_ROUGE', label: 'Label Rouge', tone: 'neutral' }
];

const TONE_ACTIVE = {
  success: 'border-green-700 bg-success-bg text-success-text',
  warning: 'border-[#EBD8BC] bg-warning-bg text-warning-text',
  neutral: 'border-ink-900 bg-ink-900 text-white'
};

const UNITES = [
  { value: 'kg', label: 'Kilogramme (kg)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'piece', label: 'Pièce' },
  { value: 'unite', label: 'Unité' }
];

const inputClass = (hasError) => `w-full border rounded-6 h-11 px-3.5 text-[14px] text-ink-900 focus:outline-none focus:border-ink-900 ${hasError ? 'border-danger-text' : 'border-sand-250'}`;
const labelClass = 'text-[12.5px] text-graphite-600 mb-1.5 block';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    reference: '', nom: '', slug: '', description: '', categorieId: '',
    prix: '', prixPromo: '', tauxTva: '5.50', uniteMesure: 'kg',
    stockQuantite: '0', stockMinAlerte: '10', imageUrl: '', labels: [],
    origine: 'France', estActif: true, estMisEnAvant: false
  });

  useEffect(() => {
    categoryService.getAll({ includeInactive: true }).then((res) => {
      if (res.success) setCategories(res.data);
    }).catch((err) => console.error('Erreur chargement catégories:', err));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    productService.getById(id).then((res) => {
      if (!res.success) return;
      const p = res.data;
      setFormData({
        reference: p.reference || '', nom: p.nom || '', slug: p.slug || '',
        description: p.description || '', categorieId: p.categorieId || '',
        prix: p.prix?.toString() || '', prixPromo: p.prixPromo?.toString() || '',
        tauxTva: p.tauxTva?.toString() || '5.50', uniteMesure: p.uniteMesure || 'kg',
        stockQuantite: p.stockQuantite?.toString() || '0', stockMinAlerte: p.stockMinAlerte?.toString() || '10',
        imageUrl: p.imageUrl || '', labels: p.labels || [], origine: p.origine || 'France',
        estActif: p.estActif !== false, estMisEnAvant: p.estMisEnAvant || false
      });
    }).catch((err) => {
      console.error('Erreur chargement produit:', err);
      toast.error('Produit non trouvé');
      navigate('/admin/produits');
    }).finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const generateSlug = (nom) => nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    if (name === 'nom' && !isEdit) {
      setFormData((prev) => ({ ...prev, nom: value, slug: generateSlug(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleLabelToggle = (value) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.includes(value) ? prev.labels.filter((l) => l !== value) : [...prev.labels, value]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.reference.trim()) newErrors.reference = 'La référence est requise';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.slug.trim()) newErrors.slug = 'Le slug est requis';
    if (!formData.categorieId) newErrors.categorieId = 'Le rayon est requis';
    if (!formData.prix || parseFloat(formData.prix) <= 0) newErrors.prix = 'Le prix doit être supérieur à 0';
    if (formData.prixPromo && parseFloat(formData.prixPromo) >= parseFloat(formData.prix)) newErrors.prixPromo = 'Le prix promo doit être inférieur au prix';
    if (parseInt(formData.stockQuantite) < 0) newErrors.stockQuantite = 'Le stock ne peut pas être négatif';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Veuillez corriger les erreurs'); return; }
    setSaving(true);
    try {
      const data = {
        reference: formData.reference, nom: formData.nom, slug: formData.slug,
        description: formData.description, categorieId: formData.categorieId,
        prix: parseFloat(formData.prix), prixPromo: formData.prixPromo ? parseFloat(formData.prixPromo) : null,
        tauxTva: parseFloat(formData.tauxTva), uniteMesure: formData.uniteMesure,
        stockQuantite: parseInt(formData.stockQuantite), stockMinAlerte: parseInt(formData.stockMinAlerte),
        imageUrl: formData.imageUrl || null, labels: formData.labels, origine: formData.origine,
        estActif: formData.estActif, estMisEnAvant: formData.estMisEnAvant
      };
      const response = isEdit ? await productService.update(id, data) : await productService.create(data);
      if (response.success) {
        toast.success(isEdit ? 'Produit mis à jour !' : 'Produit créé !');
        navigate('/admin/produits');
      } else {
        toast.error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-green-700 animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-[26px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/admin/produits" className="text-[13.5px] font-semibold text-ink-900 hover:text-green-800">← Produits</Link>
          <h2 className="font-display text-[26px] font-extrabold tracking-tighter text-ink-900 mt-1.5">
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
        </div>
        <div className="flex gap-2.5">
          {isEdit && (
            <Link to={`/produit/${formData.slug}`} target="_blank" rel="noopener noreferrer" className="h-[38px] flex items-center border border-sand-250 rounded-6 px-4 text-[13.5px] font-semibold text-ink-900 hover:border-sand-300 transition-colors">
              Aperçu
            </Link>
          )}
          <button type="submit" disabled={saving} className="h-[38px] flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white rounded-6 px-4 text-[13.5px] font-semibold transition-colors">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Enregistrer' : 'Créer le produit'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-3.5 items-start">
        <div className="flex flex-col gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-3.5">Identité</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="max-w-[340px]">
                <label className={labelClass}>Référence *</label>
                <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Ex : FRL-001" className={`${inputClass(errors.reference)} font-mono`} />
                {errors.reference && <p className="mt-1 text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.reference}</p>}
              </div>
              <div>
                <label className={labelClass}>Rayon *</label>
                <select name="categorieId" value={formData.categorieId} onChange={handleChange} className={`${inputClass(errors.categorieId)} bg-white`}>
                  <option value="">Sélectionner un rayon</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
                </select>
                {errors.categorieId && <p className="mt-1 text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.categorieId}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Nom du produit *</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex : Pommes Gala Bio" className={inputClass(errors.nom)} />
                {errors.nom && <p className="mt-1 text-[12px] text-danger-text flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.nom}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Description du produit…" className="w-full border border-sand-250 rounded-6 px-3.5 py-2.5 text-[13.5px] text-ink-900 focus:outline-none focus:border-ink-900 resize-none min-h-[96px]" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-3.5">Prix, conditionnement et stock</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div>
                <label className={labelClass}>Prix HT (€) *</label>
                <input type="number" name="prix" value={formData.prix} onChange={handleChange} step="0.01" min="0" placeholder="0.00" className={`${inputClass(errors.prix)} font-mono`} />
                {errors.prix && <p className="mt-1 text-[12px] text-danger-text">{errors.prix}</p>}
              </div>
              <div>
                <label className={labelClass}>Prix promo HT (€)</label>
                <input type="number" name="prixPromo" value={formData.prixPromo} onChange={handleChange} step="0.01" min="0" placeholder="—" className={`${inputClass(errors.prixPromo)} font-mono`} />
                {errors.prixPromo && <p className="mt-1 text-[12px] text-danger-text">{errors.prixPromo}</p>}
              </div>
              <div>
                <label className={labelClass}>Taux TVA</label>
                <select name="tauxTva" value={formData.tauxTva} onChange={handleChange} className={`${inputClass(false)} bg-white`}>
                  <option value="5.50">5,5 % (alimentaire)</option>
                  <option value="10.00">10 %</option>
                  <option value="20.00">20 % (standard)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Unité de vente</label>
                <select name="uniteMesure" value={formData.uniteMesure} onChange={handleChange} className={`${inputClass(false)} bg-white`}>
                  {UNITES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Stock</label>
                <input type="number" name="stockQuantite" value={formData.stockQuantite} onChange={handleChange} min="0" className={`${inputClass(errors.stockQuantite)} font-mono`} />
                {errors.stockQuantite && <p className="mt-1 text-[12px] text-danger-text">{errors.stockQuantite}</p>}
              </div>
              <div>
                <label className={labelClass}>Seuil d'alerte</label>
                <input type="number" name="stockMinAlerte" value={formData.stockMinAlerte} onChange={handleChange} min="0" className={`${inputClass(false)} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Origine</label>
                <input type="text" name="origine" value={formData.origine} onChange={handleChange} placeholder="Ex : France" className={inputClass(false)} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-3.5">Labels et certifications</div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LABELS.map(({ value, label, tone }) => {
                const active = formData.labels.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleLabelToggle(value)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-6 border text-[13px] font-medium transition-colors ${
                      active ? TONE_ACTIVE[tone] : 'border-sand-250 text-graphite-600 hover:border-sand-300'
                    }`}
                  >
                    {label}
                    {active && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-1">Visibilité</div>
            <Toggle checked={formData.estActif} onChange={(v) => setFormData((p) => ({ ...p, estActif: v }))} titre="Produit actif" desc="Visible sur le site" />
            <Toggle checked={formData.estMisEnAvant} onChange={(v) => setFormData((p) => ({ ...p, estMisEnAvant: v }))} titre="Mis en avant" desc="Affiché en page d'accueil" />
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-3.5">Photo</div>
            <ImageUploader value={formData.imageUrl} onChange={(url) => setFormData((p) => ({ ...p, imageUrl: url }))} onError={(msg) => toast.error(msg)} />
          </div>

          <div className="bg-white border border-sand-200 rounded-8 p-[18px]">
            <div className="font-display text-[16px] font-bold text-ink-900 mb-3.5">Référencement</div>
            <label className={labelClass}>Slug (URL)</label>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[12.5px] text-graphite-300 flex-shrink-0">/produit/</span>
              <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="pommes-gala-bio" className={`${inputClass(errors.slug)} font-mono text-[13px]`} />
            </div>
            {errors.slug && <p className="mt-1 text-[12px] text-danger-text">{errors.slug}</p>}
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdminProductForm;
