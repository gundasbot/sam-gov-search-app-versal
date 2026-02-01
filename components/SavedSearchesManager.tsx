// components/SavedSearchesManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Bell, MoreVertical } from 'lucide-react';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  keywords?: string;
  naics?: string;
  agency?: string;
  setAside?: string;
  stateOfPerformance?: string;
  lastUsedAt?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
  alertSubscriptions: Array<{
    id: string;
    name: string;
    frequency: string;
  }>;
  _count: {
    alertSubscriptions: number;
  };
}

export default function SavedSearchesManager() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches-v2');
      const data = await response.json();
      setSearches(data.searches);
    } catch (error) {
      console.error('Error fetching searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id: string) => {
    if (!confirm('Delete this saved search? All associated alert subscriptions will also be deleted.')) {
      return;
    }

    try {
      await fetch(`/api/saved-searches-v2/${id}`, {
        method: 'DELETE',
      });
      setSearches(searches.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const useSearch = (search: SavedSearch) => {
    // Navigate to search page with filters
    const params = new URLSearchParams();
    if (search.keywords) params.set('keywords', search.keywords);
    if (search.naics) params.set('naics', search.naics);
    if (search.agency) params.set('agency', search.agency);
    if (search.setAside) params.set('setAside', search.setAside);
    if (search.stateOfPerformance) params.set('state', search.stateOfPerformance);
    
    window.location.href = `/search?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
          <p className="text-gray-600 mt-1">
            Manage your saved search filters and alert subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Saved Search
        </button>
      </div>

      {/* Empty State */}
      {searches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No saved searches yet
          </h3>
          <p className="text-gray-600 mb-6">
            Save your search filters to reuse them and create alert subscriptions
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Your First Saved Search
          </button>
        </div>
      ) : (
        /* Search List */
        <div className="grid gap-4">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title and Description */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {search.name}
                    </h3>
                    {search.description && (
                      <p className="text-gray-600 text-sm">{search.description}</p>
                    )}
                  </div>

                  {/* Filters Summary */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {search.keywords && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Keywords: {search.keywords}
                      </span>
                    )}
                    {search.naics && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        NAICS: {search.naics}
                      </span>
                    )}
                    {search.agency && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Agency: {search.agency}
                      </span>
                    )}
                    {search.setAside && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Set-Aside: {search.setAside}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>Used {search.useCount} times</span>
                    <span>
                      {search._count.alertSubscriptions} active alert
                      {search._count.alertSubscriptions !== 1 ? 's' : ''}
                    </span>
                    {search.lastUsedAt && (
                      <span>
                        Last used: {new Date(search.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Active Subscriptions */}
                  {search.alertSubscriptions.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <div className="flex gap-2">
                        {search.alertSubscriptions.map(sub => (
                          <span
                            key={sub.id}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                          >
                            {sub.name} ({sub.frequency})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => useSearch(search)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Use this search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {/* TODO: Edit modal */}}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit search"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {/* TODO: Create alert modal */}}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Create alert"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteSearch(search.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete search"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Create Search Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create Saved Search</h2>
            <p className="text-gray-600">
              TODO: Add form for creating saved search
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}