import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Bir Hata Oluştu</h1>
                    <p className="text-gray-700 mb-4">Uygulama beklenmedik bir hatayla karşılaştı.</p>
                    <div className="bg-gray-100 p-4 rounded text-left w-full overflow-auto max-h-64 mb-4">
                        <code className="text-xs text-red-800 break-words">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
                    >
                        Tekrar Dene
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
