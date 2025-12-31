/**
 * Composant ProductsExportImport
 * @description Boutons et logique d'export/import Excel
 * @location frontend/src/components/admin/ProductsExportImport.jsx
 */

import { useRef } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const ProductsExportImport = ({
  categories,
  exporting,
  importing,
  onExport,
  onImport
}) => {
  const fileInputRef = useRef(null);

  // ==========================================
  // EXPORT EXCEL
  // ==========================================

  const handleExportClick = async () => {
    const data = await onExport();
    
    if (!data || data.length === 0) {
      toast.error('Aucun produit à exporter');
      return;
    }

    // Transformer les données pour Excel
    const excelData = data.map(p => ({
      'Référence': p.reference,
      'Nom': p.nom,
      'Catégorie': p.categorie,
      'Origine': p.origine,
      'Prix': p.prix,
      'Prix Promo': p.prixPromo,
      'Description': p.description,
      'Unité de mesure': p.uniteMesure,
      'Stock': p.stockQuantite,
      'Actif': p.estActif
    }));

    // Créer le workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');

    // Largeurs de colonnes
    ws['!cols'] = [
      { wch: 15 },  // Référence
      { wch: 40 },  // Nom
      { wch: 20 },  // Catégorie
      { wch: 15 },  // Origine
      { wch: 10 },  // Prix
      { wch: 10 },  // Prix Promo
      { wch: 50 },  // Description
      { wch: 15 },  // Unité
      { wch: 10 },  // Stock
      { wch: 8 }    // Actif
    ];

    // Télécharger
    const fileName = `produits_jana_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success(`${data.length} produits exportés`);
  };

  // ==========================================
  // IMPORT EXCEL
  // ==========================================

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Lire le fichier
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Le fichier est vide');
        return;
      }

      // Trouver la catégorie TBD par défaut
      const tbdCategory = categories.find(c => c.nom.toUpperCase() === 'TBD');
      if (!tbdCategory) {
        toast.error('Catégorie "TBD" non trouvée. Créez-la d\'abord.');
        return;
      }

      // Transformer les données
      const products = jsonData.map(row => ({
        reference: row['Référence'] || row['reference'] || row['Reference'] || row['REF'] || '',
        nom: row['Nom'] || row['nom'] || row['Name'] || row['NOM'] || '',
        categorie: row['Catégorie'] || row['categorie'] || row['Categorie'] || row['Category'] || '',
        origine: row['Origine'] || row['origine'] || row['Origin'] || '',
        prix: parseFloat(row['Prix'] || row['prix'] || row['Price'] || 0),
        description: row['Description'] || row['description'] || '',
        uniteMesure: row['Unité de mesure'] || row['unite_mesure'] || row['uniteMesure'] || row['Unit'] || row['Unité'] || 'kg',
        stockQuantite: parseInt(row['Stock'] || row['stock'] || row['Quantité'] || 100)
      })).filter(p => p.reference && p.nom);

      if (products.length === 0) {
        toast.error('Aucun produit valide trouvé (référence et nom requis)');
        return;
      }

      // Lancer l'import
      await onImport(products, tbdCategory.id);

    } catch (err) {
      console.error('Erreur lecture fichier:', err);
      toast.error('Erreur lors de la lecture du fichier');
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Input file caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />
      
      {/* Bouton Import */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-600 disabled:opacity-50"
      >
        {importing ? (
          <>
            <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
            Import...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Importer
          </>
        )}
      </button>
      
      {/* Bouton Export */}
      <button 
        onClick={handleExportClick}
        disabled={exporting}
        className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-600 disabled:opacity-50"
      >
        {exporting ? (
          <>
            <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
            Export...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exporter
          </>
        )}
      </button>
    </>
  );
};

// ==========================================
// INFO BOX EXPORT
// ==========================================

export const ImportInfoBox = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="font-medium text-blue-800">Format d'import Excel</h3>
        <p className="text-sm text-blue-600 mt-1">
          Colonnes attendues : <strong>Référence</strong> | <strong>Nom</strong> | Catégorie | Origine | Prix | Description | Unité de mesure | Stock
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Les produits sans catégorie existante seront assignés à "TBD". Référence et Nom sont obligatoires.
        </p>
      </div>
    </div>
  </div>
);

export default ProductsExportImport;
