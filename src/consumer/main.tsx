import { createRoot } from 'react-dom/client';
import { App } from './ZakiApp';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
