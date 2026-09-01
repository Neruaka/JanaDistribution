/**
 * Composant ProductsExportImport
 * @description Boutons et logique d'export/import Excel
 * @location frontend/src/components/admin/ProductsExportImport.jsx
 */

import { useRef } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

const EXPORT_COLUMNS = [
  { header: 'Reference', key: 'reference', width: 15 },
  { header: 'Nom', key: 'nom', width: 40 },
  { header: 'Categorie', key: 'categorie', width: 20 },
  { header: 'Origine', key: 'origine', width: 15 },
  { header: 'Prix', key: 'prix', width: 10 },
  { header: 'Prix Promo', key: 'prixPromo', width: 10 },
  { header: 'Description', key: 'description', width: 50 },
  { header: 'Unite de mesure', key: 'uniteMesure', width: 15 },
  { header: 'Stock', key: 'stockQuantite', width: 10 },
  { header: 'Actif', key: 'estActif', width: 8 }
];

const normalizeHeader = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
};

const toCellText = (value) => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || '').join('').trim();
    }
    if (value.text !== undefined && value.text !== null) {
      return String(value.text).trim();
    }
    if (value.result !== undefined && value.result !== null) {
      return String(value.result).trim();
    }
    if (value.formula && value.result !== undefined && value.result !== null) {
      return String(value.result).trim();
    }
    return '';
  }

  return String(value).trim();
};

const parseNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value || '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

const loadExcelJS = async () => {
  const module = await import('exceljs');
  return module.default;
};

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
    const ExcelJS = await loadExcelJS();
    const data = await onExport();

    if (!data || data.length === 0) {
      toast.error('Aucun produit a exporter');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produits');

    worksheet.columns = EXPORT_COLUMNS;

    data.forEach((product) => {
      worksheet.addRow({
        reference: product.reference,
        nom: product.nom,
        categorie: product.categorie,
        origine: product.origine,
        prix: product.prix,
        prixPromo: product.prixPromo,
        description: product.description,
        uniteMesure: product.uniteMesure,
        stockQuantite: product.stockQuantite,
        estActif: product.estActif
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
      [buffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const fileName = `produits_jana_${new Date().toISOString().split('T')[0]}.xlsx`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success(`${data.length} produits exportes`);
  };

  // ==========================================
  // IMPORT EXCEL
  // ==========================================

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const ExcelJS = await loadExcelJS();
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.error('Format non supporte. Utilisez un fichier .xlsx');
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        toast.error('Aucune feuille trouvee dans le fichier');
        return;
      }

      const headerMap = {};
      worksheet.getRow(1).eachCell((cell, columnIndex) => {
        const normalized = normalizeHeader(cell.text || cell.value);
        if (normalized) {
          headerMap[columnIndex] = normalized;
        }
      });

      const rows = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const rowData = {};
        row.eachCell({ includeEmpty: true }, (cell, columnIndex) => {
          const key = headerMap[columnIndex];
          if (!key) return;
          rowData[key] = toCellText(cell.value);
        });

        if (Object.keys(rowData).length > 0) {
          rows.push(rowData);
        }
      });

      if (rows.length === 0) {
        toast.error('Le fichier est vide');
        return;
      }

      const tbdCategory = categories.find((c) => c.nom.toUpperCase() === 'TBD');
      if (!tbdCategory) {
        toast.error('Categorie "TBD" non trouvee. Creez-la d\'abord.');
        return;
      }

      const products = rows
        .map((row) => ({
          reference: pickValue(row, ['reference', 'ref']),
          nom: pickValue(row, ['nom', 'name']),
          categorie: pickValue(row, ['categorie', 'category']),
          origine: pickValue(row, ['origine', 'origin']),
          prix: parseNumber(pickValue(row, ['prix', 'price']), 0),
          description: pickValue(row, ['description']),
          uniteMesure: pickValue(row, ['unite_de_mesure', 'unite', 'unit', 'unite_mesure']) || 'kg',
          stockQuantite: Math.trunc(parseNumber(pickValue(row, ['stock', 'quantite']), 100))
        }))
        .filter((product) => product.reference && product.nom);

      if (products.length === 0) {
        toast.error('Aucun produit valide trouve (reference et nom requis)');
        return;
      }

      await onImport(products, tbdCategory.id);
    } catch (err) {
      console.error('Erreur lecture fichier:', err);
      toast.error('Erreur lors de la lecture du fichier');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Input file cache */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx"
        className="hidden"
      />

      {/* Bouton Import */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="h-[38px] flex items-center gap-1.5 border border-sand-250 rounded-6 px-3.5 text-[13.5px] text-graphite-900 hover:border-sand-300 transition-colors disabled:opacity-50"
      >
        {importing ? (
          <span className="w-3.5 h-3.5 border-2 border-graphite-300/40 border-t-graphite-500 rounded-full animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {importing ? 'Import…' : 'Importer .xlsx'}
      </button>

      {/* Bouton Export */}
      <button
        type="button"
        onClick={handleExportClick}
        disabled={exporting}
        className="h-[38px] flex items-center gap-1.5 border border-sand-250 rounded-6 px-3.5 text-[13.5px] text-graphite-900 hover:border-sand-300 transition-colors disabled:opacity-50"
      >
        {exporting ? (
          <span className="w-3.5 h-3.5 border-2 border-graphite-300/40 border-t-graphite-500 rounded-full animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {exporting ? 'Export…' : 'Exporter'}
      </button>
    </>
  );
};

// ==========================================
// INFO BOX EXPORT
// ==========================================

export const ImportInfoBox = () => (
  <div className="bg-white border border-sand-200 rounded-8 p-4 flex items-start gap-3">
    <FileSpreadsheet className="w-4 h-4 text-graphite-300 mt-0.5 flex-shrink-0" />
    <div>
      <h3 className="text-[13.5px] font-semibold text-ink-900">Format d'import Excel</h3>
      <p className="text-[12.5px] text-graphite-500 mt-1">
        Colonnes attendues : <strong className="text-graphite-700">Référence</strong> | <strong className="text-graphite-700">Nom</strong> | Catégorie | Origine | Prix | Description | Unité de mesure | Stock
      </p>
      <p className="text-[12.5px] text-graphite-500 mt-1">
        Les produits sans catégorie existante seront assignés à « TBD ». Référence et Nom sont obligatoires.
      </p>
    </div>
  </div>
);

export default ProductsExportImport;
