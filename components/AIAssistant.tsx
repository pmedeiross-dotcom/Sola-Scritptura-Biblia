import React from 'react';

const AIAssistant: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-paper-50 dark:bg-navy-900 p-10 items-center justify-center text-center">
      <div className="w-16 h-16 bg-petrol-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
        <span className="text-3xl">✨</span>
      </div>
      <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2">Assistente Bíblico</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-xs">
        Estamos preparando o seu assistente teológico. Em breve você poderá tirar suas dúvidas aqui.
      </p>
    </div>
  );
};

export default AIAssistant;
