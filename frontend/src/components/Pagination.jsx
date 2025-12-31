/**
 * Composant Pagination
 * @description Pagination pour les listes de produits
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5
}) => {
  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Ajuster si on est proche du début ou de la fin
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }
    if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      {/* Première page */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Première page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
      )}

      {/* Page précédente */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
        title="Page précédente"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Points de suspension au début */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 text-gray-400">...</span>
          )}
        </>
      )}

      {/* Numéros de page */}
      {pageNumbers.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
            page === currentPage
              ? 'bg-green-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Points de suspension à la fin */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-400">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Page suivante */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg transition-colors ${
          currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
        title="Page suivante"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dernière page */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Dernière page"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      )}
    </nav>
  );
};

export default Pagination;
