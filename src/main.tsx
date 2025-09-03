import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { GameApp } from './presentation/components/GameApp'

createRoot(document.getElementById('root')!).render(
  <GameApp />
)
