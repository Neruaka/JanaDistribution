import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages (à créer)
// import Home from './pages/Home'
// import Catalog from './pages/Catalog'
// import ProductDetail from './pages/ProductDetail'
// import Cart from './pages/Cart'
// import Login from './pages/Login'
// import Register from './pages/Register'

function App() {
  return (
    <>
      {/* Notifications toast */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#4CAF50',
            },
          },
          error: {
            style: {
              background: '#F44336',
            },
          },
        }}
      />

      {/* Routes de l'application */}
      <Routes>
        {/* Page d'accueil temporaire */}
        <Route path="/" element={<HomePage />} />
        
        {/* TODO: Ajouter les routes au fur et à mesure
        <Route path="/catalogue" element={<Catalog />} />
        <Route path="/produit/:slug" element={<ProductDetail />} />
        <Route path="/panier" element={<Cart />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        */}
        
        {/* Route 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

// Page d'accueil temporaire
function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <h1 style={{ 
          color: '#2E7D32', 
          fontSize: '2.5rem',
          marginBottom: '0.5rem'
        }}>
          🥬 Jana Distribution
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '1.2rem',
          marginBottom: '2rem'
        }}>
          Commerce de gros alimentaire B2B/B2C
        </p>
        
        <div style={{
          background: '#F5F5F5',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#333', fontSize: '1.2rem', marginBottom: '1rem' }}>
            ✅ Setup Jour 3 Complété !
          </h2>
          <ul style={{ 
            textAlign: 'left', 
            color: '#555',
            lineHeight: '1.8'
          }}>
            <li>✅ Structure du projet créée</li>
            <li>✅ Backend Express configuré</li>
            <li>✅ Frontend Vite + React prêt</li>
            <li>✅ Docker Compose (PostgreSQL + Redis)</li>
            <li>⏳ Prochaine étape : Authentification (Jour 4-5)</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a 
            href="http://localhost:3000/api/health"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#4CAF50',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            🔗 Tester l'API
          </a>
          <a 
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#2196F3',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            🗄️ Adminer (DB)
          </a>
        </div>
      </div>
    </div>
  )
}

// Page 404
function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', color: '#F44336' }}>404</h1>
      <p style={{ color: '#666' }}>Page non trouvée</p>
      <a 
        href="/"
        style={{
          marginTop: '1rem',
          color: '#4CAF50',
          textDecoration: 'none'
        }}
      >
        ← Retour à l'accueil
      </a>
    </div>
  )
}

export default App
