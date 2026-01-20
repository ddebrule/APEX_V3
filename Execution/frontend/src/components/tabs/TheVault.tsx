'use client';

export default function TheVault() {
  return (
    <div className="w-full h-full bg-apex-dark text-white overflow-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="border-b border-apex-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-apex-green">
            The Vault
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono">
            Session history, Librarian AI, and institutional memory
          </p>
        </div>

        <div className="bg-apex-surface border border-apex-border rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">The Vault</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sprint 4: Semantic search, Librarian AI, and historical context retrieval
          </p>
          <p className="text-xs text-gray-600 font-mono">
            Coming after Sprint 3 completion
          </p>
        </div>
      </div>
    </div>
  );
}
