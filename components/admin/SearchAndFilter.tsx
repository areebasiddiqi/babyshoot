'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FilterOption {
  value: string
  label: string
}

interface SearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: {
    [key: string]: {
      value: string
      options: FilterOption[]
      label: string
    }
  }
  onFilterChange?: (filterKey: string, value: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  sortOptions?: FilterOption[]
  placeholder?: string
}

export default function SearchAndFilter({
  searchValue,
  onSearchChange,
  filters = {},
  onFilterChange,
  sortBy,
  sortOrder = 'desc',
  onSortChange,
  sortOptions = [],
  placeholder = 'Search...'
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = Object.values(filters).some(filter => filter.value !== '')

  const clearAllFilters = () => {
    Object.keys(filters).forEach(key => {
      onFilterChange?.(key, '')
    })
    onSearchChange('')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder={placeholder}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-primary-300 text-primary-700 bg-primary-50'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {Object.values(filters).filter(f => f.value !== '').length}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {(hasActiveFilters || searchValue) && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dynamic Filters */}
            {Object.entries(filters).map(([key, filter]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => onFilterChange?.(key, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Sort Options */}
            {sortOptions.length > 0 && onSortChange && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value, sortOrder)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortChange(sortBy || 'created_at', e.target.value as 'asc' | 'desc')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
