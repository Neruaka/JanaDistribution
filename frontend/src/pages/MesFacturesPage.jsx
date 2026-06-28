import { useState, useEffect } from 'react';
import { getMesFactures, downloadFacturePDF } from '../services/api';

export default function MesFacturesPage() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getMesFactures()
      .then(res => setFactures(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (facture) => {
    setDownloading(facture.id);
    try {
      await downloadFacturePDF(facture.id, facture.numero);
    } catch {
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );

  if (!factures.length) return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg">Aucune facture disponible</p>
      <p className="text-sm mt-2">Vos factures apparaîtront ici après chaque commande payée.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mes Factures</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Facture</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total TTC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">PDF</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {factures.map(facture => (
              <tr key={facture.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{facture.numero}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {parseFloat(facture.total_ttc).toFixed(2)} €
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                    facture.statut === 'EMISE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {facture.statut}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDownload(facture)}
                    disabled={downloading === facture.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {downloading === facture.id ? 'Téléchargement...' : '⬇ PDF'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
