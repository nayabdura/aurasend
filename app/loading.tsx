import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-50 animate-pulse">Loading data...</p>
      </div>
    </div>
  );
}
