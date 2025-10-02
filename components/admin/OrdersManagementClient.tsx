'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { 
  ShoppingBagIcon, 
  EyeIcon,
  CalendarIcon,
  UserIcon,
  PhotoIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import SearchAndFilter from './SearchAndFilter'
import Pagination from './Pagination'

interface Order {
  id: string
  status: string
  total_amount: number
  shipping_address: any
  created_at: string
  updated_at: string
  albums: {
    id: string
    title: string
    album_images: { count: number }[]
  } | null
  users: {
    email: string
    first_name?: string
    last_name?: string
  } | null
}

interface OrdersResponse {
  orders: Order[]
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
    status: string
    sortBy: string
    sortOrder: string
  }
}

export default function OrdersManagementClient() {
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, search, status, sortBy, sortOrder])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    if (filterKey === 'status') {
      setStatus(value)
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Order status updated successfully')
        fetchOrders()
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 1) // Assuming amount is in cents
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>
        <div className="text-sm text-gray-500">
          {data?.pagination.total || 0} total orders
        </div>
      </div>

      <SearchAndFilter
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={{
          status: {
            value: status,
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ],
            label: 'Status'
          }
        }}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        sortOptions={[
          { value: 'created_at', label: 'Order Date' },
          { value: 'total_amount', label: 'Amount' },
          { value: 'status', label: 'Status' },
          { value: 'updated_at', label: 'Last Updated' }
        ]}
        placeholder="Search by customer name, or album title..."
      />

      {loading ? (
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
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Album
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ShoppingBagIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.users?.first_name || order.users?.last_name 
                                ? `${order.users.first_name || ''} ${order.users.last_name || ''}`.trim()
                                : 'Unknown User'
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.users?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <PhotoIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.albums?.title || 'No album'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.albums?.album_images?.[0]?.count || 0} images
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="ml-2 text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
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
