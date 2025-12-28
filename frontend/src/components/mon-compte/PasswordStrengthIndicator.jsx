/**
 * Composant PasswordStrengthIndicator
 * Indicateur visuel de la force du mot de passe
 */

const PasswordStrengthIndicator = ({ password }) => {
  // Calculer la force
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  strength = Math.min(strength, 5);

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < strength ? colors[strength - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength < 3 ? 'text-orange-600' : 'text-green-600'}`}>
        {labels[strength - 1] || 'Très faible'}
      </p>
    </div>
  );
};

export default PasswordStrengthIndicator;
