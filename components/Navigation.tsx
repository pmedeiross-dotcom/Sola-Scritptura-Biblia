
import React from 'react';
import { BookOpen, Scroll, GraduationCap, Library, Home } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: Tab.HOME, label: 'Início', icon: Home },
    { id: Tab.BIBLE, label: 'Bíblia', icon: BookOpen },
    { id: Tab.CONFESSIONS, label: 'Confissões', icon: Scroll },
    { id: Tab.STUDY, label: 'Estudo', icon: GraduationCap },
    { id: Tab.LIBRARY, label: 'Biblioteca', icon: Library },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-navy-950/80 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-800/50 z-50">
      <div 
        className="max-w-lg mx-auto px-6 flex justify-around items-center pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center gap-1.5 transition-colors duration-500 ease-in-out active-ripple ${
                isActive 
                  ? 'text-petrol-700 dark:text-petrol-300' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400'
              }`}
            >
              {/* Indicador superior (Dot) com transição de opacidade/escala em vez de condicional */}
              <span className={`absolute -top-1 w-1.5 h-1.5 bg-petrol-500 dark:bg-petrol-400 rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_8px_rgba(0,109,119,0.3)] ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              }`} />
              
              {/* Container do Ícone com transição de background e sombra */}
              <div className={`p-2.5 rounded-2xl transition-all duration-500 ease-in-out ${
                isActive 
                  ? 'bg-petrol-100/50 dark:bg-petrol-900/30 shadow-inner' 
                  : 'bg-transparent'
              }`}>
                <Icon 
                  size={22} 
                  className="transition-all duration-500" 
                  strokeWidth={isActive ? 2.5 : 1.8} 
                />
              </div>

              {/* Texto com transição suave de opacidade e peso */}
              <span className={`text-[10px] uppercase tracking-wider transition-all duration-500 ease-in-out ${
                isActive 
                  ? 'opacity-100 font-extrabold translate-y-0' 
                  : 'opacity-60 font-medium translate-y-0.5'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
