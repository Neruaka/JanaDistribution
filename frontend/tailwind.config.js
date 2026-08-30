/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy scale — encore utilisée par des écrans non migrés (CartItem, etc.)
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },

        // ===== Design tokens — refonte Jana (design_handoff_jana_refonte) =====

        // Vert primaire : boutons, liens, accents, jauges de stock OK
        green: {
          700: '#1E7A46',
          800: '#155C34',
        },

        // Encre : fonds sombres (barre utilitaire, hero, sidebar admin, footer)
        ink: {
          900: '#10231A',
          800: '#152A20',
          700: '#1C3A2C',
          600: '#22402F',
          500: '#38584A',
        },

        // Fond neutre chaud : fond de page, en-têtes de tableau, séparateurs
        sand: {
          50: '#F6F4EE',
          100: '#FAF9F5',
          150: '#F4F2EC',
          200: '#E6E3DA',
          250: '#E0DDD3',
          300: '#EDEAE1',
        },

        // Texte sur fond clair (du plus foncé au plus clair)
        graphite: {
          900: '#28352E', // nav rayons
          700: '#3D4A43', // corps de texte
          600: '#5E6B63', // labels de formulaire
          500: '#6B7A72', // métadonnées
          400: '#7C8981', // références mono, sous-titres
          300: '#8D978F', // références mono (variante), sous-titres carte produit
          200: '#9AA69F', // placeholder
          100: '#8B968F', // placeholder (variante)
        },

        // Texte sur fond sombre (ink-900 / ink-800)
        mist: {
          DEFAULT: '#B9CCC1', // texte principal sur fond sombre
          2: '#8FA89B',       // secondaire
          3: '#7E9C8D',       // tertiaire
          4: '#6B8779',       // tertiaire (variante)
        },
        accent: {
          light: '#6FBF8E',   // accent clair sur fond sombre (surtitres)
          lighter: '#8FD8A9', // accent clair sur fond sombre (mobile admin)
          pill: '#CDEBD8',    // pastille sur fond sombre
        },

        // Sélection forte (adresse, créneau, paiement)
        'selection-bg': '#F4FAF6',

        // Statuts
        'success-bg': '#EAF3EC',
        'success-text': '#155C34',
        'success-border': '#CBE2D3',
        'warning-bg': '#FBF4E4',
        'warning-bg-alt': '#FBF1E4',
        'warning-text': '#8A5A16',
        'warning-border': '#EBD8BC',
        'danger-bg': '#FBEDE9',
        'danger-text': '#9A3A2E',
        'danger-border': '#E7CFCF',
        'neutral-status-bg': '#F2F1EC',
        'neutral-status-text': '#3D4A43',

        // Badges type client
        'pro-bg': '#F0EDF7',
        'pro-text': '#4A3B7A',
        'particulier-bg': '#EDF1F5',
        'particulier-text': '#2F4A63',

        // Jauges de stock
        'stock-ok': '#1E7A46',
        'stock-mid': '#C88A2E',
        'stock-low': '#C4523E',

        // Graphiques (dashboard admin)
        chart: {
          1: '#1E7A46',
          2: '#4E9E6E',
          3: '#88BFA0',
          4: '#B9D9C6',
          5: '#DCEAE1',
        },
        'bar-default': '#9CC9AE',
        'bar-current': '#10231A',
        'bar-on-dark': '#3D7A55',

        // Voiles modaux
        'overlay-desktop': 'rgba(16,35,26,0.55)',
        'overlay-mobile': 'rgba(16,35,26,0.45)',
      },

      fontFamily: {
        // Interface et corps de texte (partout)
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        // Titres (Archivo 700/800)
        display: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        // Prix, références, quantités, KPI — jamais de sans-serif pour les chiffres
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      letterSpacing: {
        tighter: '-0.035em', // gros titres (hero)
        tight: '-0.02em',    // titres courants
        wide: '0.06em',      // micro-labels majuscules
        wider: '0.14em',     // surtitres mono
        widest: '0.22em',    // logo « DISTRIBUTION »
      },

      borderRadius: {
        3: '3px',  // micro-pastille
        5: '5px',  // vignette
        7: '7px',  // bouton mobile
        9: '9px',  // carte mobile
        10: '10px',
        11: '11px', // interrupteur
        14: '14px', // cadre téléphone
      },

      boxShadow: {
        // Réservé au chrome des maquettes / cartes d'écran — jamais sur une carte de contenu
        mockup: '0 18px 40px rgba(16,35,26,0.08)',
        modal: '0 30px 70px rgba(16,35,26,0.35)',
      },
    },
  },
  plugins: [],
}
