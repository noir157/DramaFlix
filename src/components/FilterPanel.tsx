import React from 'react';
import { useStore } from '../store/useStore';
import { Save } from 'lucide-react';

export function FilterPanel() {
  const { filters, setFilters, savedFilters, saveFilterPreset } = useStore();

  const handleSavePreset = () => {
    const name = prompt('Enter a name for this filter combination:');
    if (name) {
      saveFilterPreset(name, filters);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 backdrop-blur border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <select
          value={filters.genre}
          onChange={(e) => setFilters({ genre: e.target.value })}
          className="bg-gray-700 rounded-lg px-4 py-2"
        >
          <option value="">All Genres</option>
          {/* Add genre options */}
        </select>

        <select
          value={filters.language}
          onChange={(e) => setFilters({ language: e.target.value })}
          className="bg-gray-700 rounded-lg px-4 py-2"
        >
          <option value="">All Languages</option>
          {/* Add language options */}
        </select>

        <select
          value={filters.duration}
          onChange={(e) => setFilters({ duration: e.target.value })}
          className="bg-gray-700 rounded-lg px-4 py-2"
        >
          <option value="">Any Duration</option>
          <option value="short">&lt; 90 min</option>
          <option value="medium">90-120 min</option>
          <option value="long">&gt; 120 min</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value as any })}
          className="bg-gray-700 rounded-lg px-4 py-2"
        >
          <option value="popularity">Most Popular</option>
          <option value="date">Release Date</option>
          <option value="rating">Highest Rated</option>
        </select>

        {savedFilters.length > 0 && (
          <select
            onChange={(e) => {
              const preset = savedFilters.find((f) => f.name === e.target.value);
              if (preset) {
                setFilters(preset);
              }
            }}
            className="bg-gray-700 rounded-lg px-4 py-2"
          >
            <option value="">Saved Filters</option>
            {savedFilters.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleSavePreset}
          className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 rounded-lg px-4 py-2 transition-colors"
        >
          <Save size={18} />
          Save Filters
        </button>
      </div>
    </div>
  );
}