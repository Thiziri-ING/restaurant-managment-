import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, ShoppingBasket } from 'lucide-react';
import { usePosStore } from '@/stores/pos.store';
import { CartPanel } from '@/components/pos/CartPanel';

export function MenuClientPage({ isTakeaway = false }: { isTakeaway?: boolean }) {
  const navigate = useNavigate();
  const addItem = usePosStore((s) => s.addItem);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Entrées');

  const products = [
    { id: 1, name: 'Salade César', description: 'Romaine, poulet grillé, parmesan', price: '650', category: 'Entrées', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=300&h=200' },
    { id: 2, name: 'Soupe à l\'oignon', description: 'Gratinée au fromage', price: '450', category: 'Entrées', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=300&h=200' },
    { id: 3, name: 'Bruschetta', description: 'Tomate, basilic, ail', price: '380', category: 'Entrées', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&q=80&w=300&h=200' },
    { id: 4, name: 'Carpaccio de bœuf', description: 'Copeaux de parmesan, roquette', price: '780', category: 'Entrées', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=300&h=200' },
    { id: 5, name: 'Pizza Margherita', description: 'Sauce tomate, mozzarella, basilic', price: '800', category: 'Pizzas', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=300&h=200' },
    { id: 6, name: 'Steak Frites', description: 'Faux-filet grillé, frites maison', price: '1500', category: 'Plats', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=300&h=200' },
    { id: 7, name: 'Tiramisu', description: 'Mascarpone, café, cacao', price: '400', category: 'Desserts', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=300&h=200' }
  ];

  const categories = ['Entrées', 'Plats', 'Pizzas', 'Boissons', 'Desserts'];

  const tables = [
    { id: 'T1', zone: 'Salle' }, { id: 'T3', zone: 'Salle' }, { id: 'T5', zone: 'Salle' },
    { id: 'T7', zone: 'Salle' }, { id: 'T8', zone: 'Salle' }, { id: 'T9', zone: 'Terrasse' },
    { id: 'T11', zone: 'Terrasse' }, { id: 'T12', zone: 'Terrasse' }, { id: 'T14', zone: 'Terrasse' },
    { id: 'T15', zone: 'Cafeteria' }, { id: 'T16', zone: 'Cafeteria' }
  ];

  // Filtering logic
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'Tous' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full bg-[#f4f7f9] text-slate-800">
      
      {/* ── PARTIE GAUCHE (MENU) ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* ── HEADER (Top Bar) ── */}
        <div className="h-16 flex items-center justify-between px-6 bg-[#f4f7f9] shrink-0">
          <div className="flex items-center gap-2 text-slate-700 text-[13px] font-semibold">
            <Clock size={14} /> 17:52:10 Mar. 14 Juil.
          </div>

          <div className="relative w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-[14px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {!isTakeaway ? (
            <button 
              onClick={() => navigate('/takeaway')}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-slate-800 font-bold text-[13px] hover:bg-slate-50 transition-colors"
            >
              <ShoppingBasket size={16} /> Commande à emporter
            </button>
          ) : (
            <button 
              onClick={() => navigate('/carte')}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-slate-800 font-bold text-[13px] hover:bg-slate-50 transition-colors"
            >
              Fermer la caisse
            </button>
          )}
        </div>

        {/* ── CONTENU (Catégories + Produits) ── */}
        <div className="flex-1 px-6 pt-2 pb-6 overflow-auto">
          
          {/* Catégories */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveCategory('Tous')}
              className={`px-5 py-2 rounded-lg font-bold text-[14px] shadow-sm transition-colors whitespace-nowrap ${
                activeCategory === 'Tous' 
                  ? 'bg-[#edf2fa] border-2 border-blue-400 text-slate-900' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-lg font-bold text-[14px] shadow-sm transition-colors whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-[#edf2fa] border-2 border-blue-400 text-slate-900' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grille */}
          <div className="flex flex-wrap gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  onClick={() => {
                    if (isTakeaway) {
                      addItem({ id: product.id.toString(), name: product.name, price: Number(product.price) });
                    } else {
                      navigate('/takeaway');
                      setTimeout(() => {
                        addItem({ id: product.id.toString(), name: product.name, price: Number(product.price) });
                      }, 100);
                    }
                  }}
                  className="w-56 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="h-32 bg-slate-200 w-full overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col items-center text-center flex-1">
                    <h3 className="font-bold text-[14px] text-slate-900 leading-tight mb-1">{product.name}</h3>
                    <p className="text-[12px] text-slate-500 font-medium leading-tight mb-3 flex-1">{product.description}</p>
                    <div className="text-blue-500 font-black text-[15px]">
                      {product.price} <span className="text-[12px]">DA</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full py-10 text-center text-slate-500 font-medium">
                Aucun produit ne correspond à votre recherche.
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION TABLES (Bas de page) ── */}
        <div className="bg-[#f4f7f9] px-6 pb-4 shrink-0 border-t border-slate-200/50 pt-4 mt-auto">
          <h2 className="text-[13px] font-black text-slate-800 tracking-wide mb-3 uppercase">
            Tables libres — Cliquez pour commander
          </h2>
          <div className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <button 
                key={table.id}
                className="px-3 py-1.5 rounded-lg border border-green-300 bg-green-50 text-slate-800 font-bold text-[13px] hover:bg-green-100 transition-colors"
              >
                {table.id} <span className="font-semibold text-slate-500 text-[12px]">({table.zone})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PARTIE DROITE (CART PANEL) ── */}
      {isTakeaway && (
        <div className="w-[400px] shrink-0 p-3 h-full overflow-hidden border-l border-slate-200">
          <CartPanel orderType="TAKEAWAY" selectedTable={null} />
        </div>
      )}

    </div>
  );
}