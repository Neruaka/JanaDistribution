/**
 * Error Boundary global (T13-18)
 * @description Sans ce filet, toute exception de rendu React non catchee fait
 * crasher tout l'arbre vers une page blanche, y compris pendant le checkout
 * ou la connexion. React ne propose pas d'equivalent hook, donc composant classe.
 */

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erreur non interceptee dans l\'arbre React:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sand-50 px-6">
          <div className="max-w-md w-full text-center">
            <h1 className="font-display font-extrabold text-[22px] text-ink-900 mb-3">
              Une erreur est survenue
            </h1>
            <p className="text-[14px] text-graphite-700 mb-6">
              Quelque chose s'est mal passe. Vous pouvez recharger la page ou revenir a l'accueil.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="h-[44px] px-5 bg-green-700 hover:bg-green-800 text-white rounded-6 text-[14px] font-semibold transition-colors"
              >
                Recharger la page
              </button>
              <a
                href="/"
                className="h-[44px] px-5 flex items-center bg-white border border-graphite-200 hover:bg-sand-100 text-ink-900 rounded-6 text-[14px] font-semibold transition-colors"
              >
                Retour a l'accueil
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
