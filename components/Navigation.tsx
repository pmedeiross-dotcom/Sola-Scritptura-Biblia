import React from 'react';
import { BookOpen, Scroll, GraduationCap, Library, Home, Search, Sparkles } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: Tab.HOME, label: 'Início', short: 'Casa', icon: Home },
    { id: Tab.BIBLE, label: 'Bíblia', short: 'Texto', icon: BookOpen, featured: true },
    { id: Tab.CONFESSIONS, label: 'Doutrina', short: 'Fé', icon: Scroll },
    { id: Tab.STUDY, label: 'Estudo', short: 'Mesa', icon: GraduationCap },
    { id: Tab.LIBRARY, label: 'Acervo', short: 'Livros', icon: Library },
  ];

  return (
    <nav className="ss-navigation fixed z-[80] left-3 right-3 bottom-[calc(12px+var(--sab))] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[min(720px,calc(100vw-40px))]">
      <div className="ss-nav-inner relative mx-auto px-2 py-2 flex items-center justify-between gap-1">
        <div className="ss-nav-glow" aria-hidden="true" />
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`ss-nav-item ${isActive ? 'is-active' : ''} ${item.featured ? 'is-featured' : ''}`}
            >
              <span className="ss-nav-icon-wrap">
                {item.featured && <span className="ss-nav-spark"><Sparkles size={9} /></span>}
                <Icon size={item.featured ? 21 : 19} strokeWidth={isActive ? 2.4 : 1.8} />
              </span>
              <span className="ss-nav-label"><span className="hidden sm:inline">{item.label}</span><span className="sm:hidden">{item.short}</span></span>
            </button>
          );
        })}
        <button type="button" className="ss-nav-search" aria-label="Pesquisar" onClick={() => onTabChange(Tab.BIBLE)}>
          <Search size={15} />
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
