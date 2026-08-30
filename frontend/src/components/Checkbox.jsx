/**
 * Checkbox — case à cocher visuelle du design system (15px, coin arrondi, coche verte)
 * @see design_handoff_jana_refonte/README.md
 */

const Checkbox = ({ checked, className = '' }) => (
  <span
    className={`w-[15px] h-[15px] rounded-3 border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors ${
      checked ? 'bg-green-700 border-green-700' : 'border-[#CFCBC0]'
    } ${className}`}
  >
    {checked && (
      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none">
        <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </span>
);

export default Checkbox;
