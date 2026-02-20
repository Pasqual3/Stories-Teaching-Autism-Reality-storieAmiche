import React from 'react'
import Navbar from '../components/Navbar'
import Header from '../components/Header'

// PAGINA: HOME
// Questa è la pagina principale (Landing Page).
// Renderizza la barra di navigazione (Navbar) e l'intestazione principale (Header),
// che contiene a sua volta la lista/ricerca delle storie.
const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-100 to-purple-300">
      <Navbar /> {/* Menu di navigazione in alto */}
      <Header /> {/* Contenuto principale: Hero section + Lista Storie */}
    </div>
  )
}

export default Home
