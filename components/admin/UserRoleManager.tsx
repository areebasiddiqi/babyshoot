'use client'

import { useState } from 'react'
import { UserRole } from '@/lib/admin-utils'

interface UserRoleManagerProps {
  userId: string
  currentRole: UserRole
  isCurrentUser: boolean
}

export default function UserRoleManager({ userId, currentRole, isCurrentUser }: UserRoleManagerProps) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [isLoading, setIsLoading] = useState(false)

  const updateRole = async (newRole: UserRole) => {
    if (isCurrentUser && newRole !== 'super_admin') {
      alert('You cannot change your own role to a lower level')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        }),
      })

      if (response.ok) {
        setRole(newRole)
      } else {
        const error = await response.json()
        console.error('Failed to update role:', error)
        alert('Failed to update role: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('An error occurred while updating the role')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Admin'
      default:
        return 'User'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role)}`}>
        {getRoleLabel(role)}
      </span>
      
      {!isCurrentUser && (
        <select
          value={role}
          onChange={(e) => updateRole(e.target.value as UserRole)}
          disabled={isLoading}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      )}
      
      {isCurrentUser && (
        <span className="text-xs text-gray-500">(You)</span>
      )}
    </div>
  )
}
