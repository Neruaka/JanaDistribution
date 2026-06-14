/**
 * Page affichée quand l'utilisateur annule le paiement Stripe.
 * La commande reste en EN_ATTENTE / PENDING, on propose de réessayer
 * ou de retourner au panier.
 */

import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../services/paymentService';
import toast from 'react-hot-toast';

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!orderId) {
      toast.error('Identifiant de commande manquant.');
      return;
    }
    setRetrying(true);
    try {
      const { url } = await createCheckoutSession(orderId);
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de relancer le paiement.');
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <XCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
        <p className="text-gray-600 mb-6">
          Votre paiement n'a pas été finalisé. Votre commande est toujours en attente,
          vous pouvez réessayer ou y revenir plus tard depuis votre compte.
        </p>
        <div className="flex flex-col gap-3">
          {orderId && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {retrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirection…
                </>
              ) : (
                'Réessayer le paiement'
              )}
            </button>
          )}
          <Link to="/mes-commandes" className="text-blue-600 hover:underline">
            Voir mes commandes
          </Link>
          <Link to="/catalogue" className="text-gray-600 hover:underline">
            Retour au catalogue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
