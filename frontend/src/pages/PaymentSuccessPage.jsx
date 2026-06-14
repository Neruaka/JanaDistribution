/**
 * Page de retour après paiement Stripe réussi
 * @description L'utilisateur revient ici après une Checkout Session Stripe.
 *              On poll le backend quelques secondes pour laisser au webhook
 *              le temps d'arriver et de marquer la commande PAID.
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { getSessionStatus } from '../services/paymentService';

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 20; // ~30s max

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('loading'); // loading | paid | pending | error
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('Session de paiement manquante dans l\'URL.');
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getSessionStatus(sessionId);
        if (cancelled) return;

        setOrder(data);

        if (data.paiementStatut === 'PAID') {
          setStatus('paid');
          return;
        }

        if (data.paiementStatut === 'FAILED') {
          setStatus('error');
          setError('Le paiement a échoué.');
          return;
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
          setStatus('pending');
          return;
        }
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err.response?.data?.message || 'Impossible de vérifier le paiement.');
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Vérification du paiement…</h2>
          <p className="text-gray-500 mt-2">Merci de patienter quelques instants.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
          <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement non confirmé</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Link to="/mes-commandes" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Voir mes commandes
            </Link>
            <Link to="/catalogue" className="text-blue-600 hover:underline">Retour au catalogue</Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
          <Loader2 className="h-14 w-14 text-blue-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement en cours de validation</h1>
          <p className="text-gray-600 mb-6">
            Stripe n'a pas encore confirmé votre paiement. Cela peut prendre quelques instants.
            Vous recevrez un email dès que la commande sera validée.
          </p>
          {order && (
            <Link
              to={`/mes-commandes/${order.orderId}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voir ma commande <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // status === 'paid'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
        <p className="text-gray-600 mb-2">
          Merci, votre commande <span className="font-semibold">{order?.numeroCommande}</span> est bien payée.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Un email de confirmation vous sera envoyé sous peu.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(`/commande/confirmation/${order.orderId}`)}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voir le récapitulatif <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <Link to="/catalogue" className="text-blue-600 hover:underline">Continuer mes achats</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;
