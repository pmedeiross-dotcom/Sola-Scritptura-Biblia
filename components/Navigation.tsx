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
    { id: Tab.CONFESSIONS, label: 'Confissões', icon: Scroll },
    { id: Tab.BIBLE, label: 'Bíblia', icon: BookOpen, featured: true },
    { id: Tab.STUDY, label: 'Estudo', icon: GraduationCap },
    { id: Tab.LIBRARY, label: 'Biblioteca', icon: Library },
  ];

  return (
    <nav className="ss-navigation fixed z-50 left-3 right-3 bottom-3 sm:left-5 sm:right-5 sm:bottom-5">
      <div className="ss-nav-inner mx-auto max-w-3xl px-2 sm:px-4 py-2.5 flex items-end justify-around gap-1">
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
                <Icon size={item.featured ? 23 : 19} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span className="ss-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
