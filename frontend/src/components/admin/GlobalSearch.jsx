/**
 * GlobalSearch — recherche transverse produits / commandes / clients (⌘K)
 * @description Recherche reelle sur 3 endpoints admin ; pas d'ecran maquette dedie,
 * repris tel quel (logique inchangee) et restyle pour coller au design system.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, ShoppingCart, Users } from 'lucide-react';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], orders: [], clients: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults({ products: [], orders: [], clients: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ products: [], orders: [], clients: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { default: api } = await import('../../services/api');

        const [productsRes, ordersRes, clientsRes] = await Promise.allSettled([
          api.get(`/products?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/admin/orders?search=${encodeURIComponent(query)}&limit=5`),
          api.get(`/admin/clients?search=${encodeURIComponent(query)}&limit=5`)
        ]);

        setResults({
          products: productsRes.status === 'fulfilled' ? productsRes.value.data.data || [] : [],
          orders: ordersRes.status === 'fulfilled' ? ordersRes.value.data.data || [] : [],
          clients: clientsRes.status === 'fulfilled' ? clientsRes.value.data.data || [] : []
        });
      } catch (error) {
        console.error('Erreur recherche:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (type, item) => {
    onClose();
    switch (type) {
      case 'product':
        navigate(`/admin/produits/${item.id}/modifier`);
        break;
      case 'order':
        navigate(`/admin/commandes/${item.id}`);
        break;
      case 'client':
        navigate(`/admin/clients?clientId=${item.id}`);
        break;
      default:
        break;
    }
  };

  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.clients.length > 0;

  if (!isOpen) return null;

  const Section = ({ title, icon: Icon, items, type, renderLine }) =>
    items.length > 0 && (
      <div className="mb-3.5 last:mb-0">
        <p className="px-3 py-1.5 text-[11px] font-semibold text-graphite-400 uppercase tracking-wide">{title}</p>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(type, item)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-6 hover:bg-sand-50 text-left transition-colors"
          >
            <Icon className="w-4 h-4 text-graphite-300 flex-shrink-0" />
            {renderLine(item)}
          </button>
        ))}
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-overlay-desktop"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-10 shadow-modal overflow-hidden mx-4"
      >
        <div className="flex items-center gap-3 p-4 border-b border-sand-200">
          <Search className="w-4 h-4 text-graphite-300 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une commande, un produit, un client…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-ink-900 placeholder-graphite-200"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="px-1.5 py-0.5 text-[11px] bg-sand-100 rounded-3 text-graphite-400 flex-shrink-0">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length < 2 ? (
            <div className="p-8 text-center text-[13.5px] text-graphite-500">
              Tapez au moins 2 caractères pour rechercher
            </div>
          ) : !hasResults && !loading ? (
            <div className="p-8 text-center text-[13.5px] text-graphite-500">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            <>
              <Section
                title="Produits"
                icon={Package}
                items={results.products}
                type="product"
                renderLine={(p) => (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-ink-900 truncate">{p.nom}</p>
                    <p className="text-[12px] font-mono text-graphite-300">{p.reference}</p>
                  </div>
                )}
              />
              <Section
                title="Commandes"
                icon={ShoppingCart}
                items={results.orders}
                type="order"
                renderLine={(o) => (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-mono text-ink-900">{o.numeroCommande}</p>
                    <p className="text-[12px] text-graphite-400">{o.client?.prenom} {o.client?.nom}</p>
                  </div>
                )}
              />
              <Section
                title="Clients"
                icon={Users}
                items={results.clients}
                type="client"
                renderLine={(c) => (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-ink-900">{c.prenom} {c.nom}</p>
                    <p className="text-[12px] text-graphite-400">{c.email}</p>
                  </div>
                )}
              />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GlobalSearch;
