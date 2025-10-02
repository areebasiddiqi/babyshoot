'use client'

import { useState } from 'react'
import { 
  UserIcon, 
  ShieldCheckIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import SearchAndFilter from './SearchAndFilter'
import Pagination from './Pagination'
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useAdminQueries'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
  created_at: string
  updated_at: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    search: string
    role: string
    sortBy: string
    sortOrder: string
  }
}

export default function UsersManagementClient() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Use React Query for data fetching
  const { data, isLoading, error } = useAdminUsers({
    page,
    limit,
    search,
    role,
    sortBy,
    sortOrder
  })

  // Use React Query mutation for role updates
  const updateRoleMutation = useUpdateUserRole()

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    if (filterKey === 'role') {
      setRole(value)
      setPage(1)
    }
  }

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const updateUserRole = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load users</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="text-sm text-gray-500">
          {data?.pagination.total || 0} total users
        </div>
      </div>

      <SearchAndFilter
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={{
          role: {
            value: role,
            options: [
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
              { value: 'super_admin', label: 'Super Admin' }
            ],
            label: 'Role'
          }
        }}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        sortOptions={[
          { value: 'created_at', label: 'Created Date' },
          { value: 'email', label: 'Email' },
          { value: 'first_name', label: 'First Name' },
          { value: 'updated_at', label: 'Last Updated' }
        ]}
        placeholder="Search by email, name..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'No name'
                              }
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data?.pagination && (
            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
              hasNext={data.pagination.hasNext}
              hasPrev={data.pagination.hasPrev}
              total={data.pagination.total}
              limit={data.pagination.limit}
            />
          )}
        </>
      )}
    </div>
  )
}
