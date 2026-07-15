import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f9]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {/* Le conteneur prend tout l'espace disponible */}
        <Outlet />
      </main>
    </div>
  );
}