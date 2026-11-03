import React from 'react';
import { Calendar, Dumbbell, TrendingUp, BookOpen } from 'lucide-react';

export default function BottomDock({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'vault', label: 'Vault', icon: BookOpen },
  ];

  return (
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090D]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 pt-1.5 bottom-dock-safe-area">
      <div class="grid grid-cols-4 gap-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 ${
                isActive
                  ? 'text-volt font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div class={`p-1 rounded-lg transition-all ${isActive ? 'bg-volt/15' : ''}`}>
                <Icon class={`w-5 h-5 ${isActive ? 'text-volt stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span class="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

