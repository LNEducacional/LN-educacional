import { useState } from 'react';

export default function TestIsland({ message = 'Island Hydrated!' }: { message?: string }) {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-semibold text-green-800">{message}</h3>
      <p className="text-sm text-green-600 mb-2">Este componente foi hidratado como uma island.</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCount(count - 1)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          -
        </button>
        <span className="px-3 py-1 bg-gray-100 rounded">Count: {count}</span>
        <button
          onClick={() => setCount(count + 1)}
          className="px-2 py-1 bg-green-500 text-white rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}
