import React, { useState } from 'react';

export default function SimpleTabs({ tabs, initial = 0 }) {
  const [active, setActive] = useState(initial);
  return (
    <div>
      <div className="flex border-b mb-4">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${active === idx ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-orange-600'}`}
            onClick={() => setActive(idx)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
