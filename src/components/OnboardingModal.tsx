import { Book, Library, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onGoBible: () => void;
  onGoConfessions: () => void;
}

export default function OnboardingModal({ onClose, onGoBible, onGoConfessions }: OnboardingModalProps) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-6 sm:p-8 animate-fade-in-up">
        <p className="text-xs font-semibold tracking-wide text-petrol-600">Bem-vindo ao Sola Scriptura</p>
        <h2 className="mt-2 text-2xl font-bold text-petrol-900 dark:text-white">Tudo pronto para seu estudo</h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Definimos um fluxo inicial para você começar rápido e aproveitar melhor os recursos do app.
        </p>

        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">1. Leitura bíblica contínua</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Abra a Bíblia, pesquise passagens e salve notas por referência.</p>
          </div>
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">2. Símbolos de fé organizados</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Westminster, Heidelberg e Belga com índice por seções.</p>
          </div>
          <div className="rounded-2xl bg-paper-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">3. App ajustável</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Personalize tema e tamanho de fonte em Ajustes.</p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <button
            onClick={onGoBible}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-petrol-500 hover:bg-petrol-600 text-white font-semibold"
          >
            <Book className="w-4 h-4" />
            Começar pela Bíblia
          </button>
          <button
            onClick={onGoConfessions}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-semibold"
          >
            <Library className="w-4 h-4" />
            Abrir Símbolos de Fé
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Sparkles className="w-4 h-4" />
          Continuar sem atalho
        </button>
      </div>
    </div>
  );
}
