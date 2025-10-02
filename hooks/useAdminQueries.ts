import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// Types
interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
  created_at: string
  updated_at: string
}

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

interface PaginatedResponse<T> {
  data: T[]
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
    [key: string]: string
  }
}

// Query Keys
export const adminQueryKeys = {
  users: (params: any) => ['admin', 'users', params],
  orders: (params: any) => ['admin', 'orders', params],
  user: (id: string) => ['admin', 'user', id],
  order: (id: string) => ['admin', 'order', id],
}

// Users Queries
export function useAdminUsers(params: {
  page: number
  limit: number
  search: string
  role: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: adminQueryKeys.users(params),
    queryFn: async (): Promise<PaginatedResponse<User> & { users: User[] }> => {
      const searchParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        search: params.search,
        role: params.role,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      })

      const response = await fetch(`/api/admin/users?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Orders Queries
export function useAdminOrders(params: {
  page: number
  limit: number
  search: string
  status: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: adminQueryKeys.orders(params),
    queryFn: async (): Promise<PaginatedResponse<Order> & { orders: Order[] }> => {
      const searchParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      })

      const response = await fetch(`/api/admin/orders?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 3, // 3 minutes
  })
}

// User Role Update Mutation
export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate all user queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User role updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update user role')
      console.error('Error updating user role:', error)
    },
  })
}

// Order Status Update Mutation
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate all order queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      toast.success('Order status updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update order status')
      console.error('Error updating order status:', error)
    },
  })
}
