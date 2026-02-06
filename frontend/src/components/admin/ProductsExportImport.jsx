/**
 * Composant ProductsExportImport
 * @description Boutons et logique d'export/import Excel
 * @location frontend/src/components/admin/ProductsExportImport.jsx
 */

import { useRef } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
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
          Colonnes attendues : <strong>Reference</strong> | <strong>Nom</strong> | Categorie | Origine | Prix | Description | Unite de mesure | Stock
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Les produits sans categorie existante seront assignes a "TBD". Reference et Nom sont obligatoires.
        </p>
      </div>
    </div>
  </div>
);

export default ProductsExportImport;
