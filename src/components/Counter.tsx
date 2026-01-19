import React, { useState } from 'react';

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div className="p-6 my-8 bg-zinc-800 rounded-xl border border-zinc-700 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Interactive Component</h3>
            <div className="text-4xl font-mono text-indigo-400 mb-4">{count}</div>
            <div className="space-x-4">
                <button
                    className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600 active:bg-zinc-500 transition-colors"
                    onClick={() => setCount(count - 1)}
                >
                    -1
                </button>
                <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 active:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                    onClick={() => setCount(count + 1)}
                >
                    +1
                </button>
            </div>
            <p className="mt-4 text-sm text-zinc-400">
                This is a fully interactive React component embedded in Markdown!
            </p>
        </div>
    );
}
