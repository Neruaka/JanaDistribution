/**
 * Toggle — interrupteur 38x22px
 * @see design_handoff_jana_refonte/README.md ("Rayons" — 11-12px interrupteur)
 */

const Toggle = ({ checked, onChange, titre, desc }) => (
  <label className="flex items-center gap-3.5 py-[11px] border-b border-[#F0EEE7] last:border-b-0 cursor-pointer">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[38px] h-[22px] rounded-11 flex-shrink-0 transition-colors ${checked ? 'bg-green-700' : 'bg-[#D8D5CB]'}`}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[19px]' : 'left-[3px]'}`} />
    </button>
    <div>
      <div className="text-[13.5px] font-semibold text-ink-900">{titre}</div>
      {desc && <div className="text-[12.5px] text-graphite-500">{desc}</div>}
    </div>
  </label>
);

export default Toggle;
