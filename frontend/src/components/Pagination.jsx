/**
 * Composant Pagination
 * @description Pagination pour les listes de produits
 * @see design_handoff_jana_refonte/README.md ("02 — Catalogue & filtres")
 */

const PageButton = ({ children, active, disabled, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`w-[34px] h-[34px] flex items-center justify-center rounded-5 text-[13px] transition-colors ${
      active
        ? 'bg-ink-900 text-white'
        : disabled
          ? 'border border-sand-250 text-graphite-200 cursor-not-allowed'
          : 'border border-sand-250 text-graphite-700 hover:border-sand-300'
    }`}
  >
    {children}
  </button>
);

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxVisiblePages = 5
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

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

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center gap-1.5">
      <PageButton label="Page précédente" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        ‹
      </PageButton>

      {pageNumbers[0] > 1 && (
        <>
          <PageButton onClick={() => onPageChange(1)}>1</PageButton>
          {pageNumbers[0] > 2 && <span className="px-1 text-graphite-300">…</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <PageButton key={page} active={page === currentPage} onClick={() => onPageChange(page)}>
          {page}
        </PageButton>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-1 text-graphite-300">…</span>}
          <PageButton onClick={() => onPageChange(totalPages)}>{totalPages}</PageButton>
        </>
      )}

      <PageButton label="Page suivante" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        ›
      </PageButton>
    </nav>
  );
};

export default Pagination;
