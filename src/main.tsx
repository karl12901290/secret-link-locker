
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure GPT Engineer script is loaded for Select feature
if (typeof window !== 'undefined' && !document.querySelector('script[src*="gptengineer.js"]')) {
  const script = document.createElement('script');
  script.src = 'https://cdn.gpteng.co/gptengineer.js';
  script.type = 'module';
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(<App />);
