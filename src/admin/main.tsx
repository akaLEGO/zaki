import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp';

const root = document.getElementById('root');
if (root) createRoot(root).render(<AdminApp />);
