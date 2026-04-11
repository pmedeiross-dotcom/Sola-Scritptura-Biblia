import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('App crashed:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '560px', width: '100%', background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.10)' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Algo deu errado</h1>
            <p style={{ marginTop: '10px', color: '#475569', lineHeight: 1.6 }}>
              O aplicativo encontrou um erro inesperado. Seus dados locais permanecem salvos.
            </p>
            {this.state.message ? (
              <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                Detalhe: {this.state.message}
              </p>
            ) : null}
            <button
              onClick={this.handleReload}
              style={{ marginTop: '18px', border: 0, borderRadius: '12px', padding: '10px 16px', background: '#0f766e', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              Recarregar aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
