"use client";

import { useTransition, useState } from 'react';
import { migrateProjects } from './actions';

export default function MigratePage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigration = () => {
    startTransition(async () => {
      const migrationResult = await migrateProjects();
      setResult(migrationResult);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to update your existing projects.
          This will add the `isDarkModeOnly` field to any projects that are missing it.
        </p>
        <button
          onClick={handleMigration}
          disabled={isPending}
          className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Migrating...' : 'Start Migration'}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-md text-sm ${
              result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <p className="font-semibold">{result.success ? 'Success!' : 'Error'}</p>
            <p>{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
