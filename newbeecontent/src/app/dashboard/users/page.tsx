'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { Trash2, Edit, Plus, Users, Shield, Eye, Settings } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  createdAt: string
  redeRoles: Array<{
    role: string
    rede: {
      id: string
      name: string
    }
  }>
  hotelRoles: Array<{
    role: string
    hotel: {
      id: string
      name: string
    }
  }>
  _count: {
    redes: number
    hotels: number
    posts: number
  }
}

interface NewUser {
  email: string
  password: string
  role: string
}

interface EditUser {
  email: string
  password: string
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<NewUser>({ email: '', password: '', role: 'viewer' })
  const [editUser, setEditUser] = useState<EditUser>({ email: '', password: '', role: 'viewer' })
  const router = useRouter()

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 3000)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      if (error.response?.status === 401) {
        router.push('/login')
        return
      }
      if (error.response?.status === 403) {
        showToast('Acesso negado. Apenas superadmins podem gerenciar usuários.', 'error')
        router.push('/dashboard')
        return
      }
      showToast('Erro ao carregar usuários', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      await axios.post('/api/users', newUser)
      showToast('Usuário criado com sucesso!')
      setCreateDialogOpen(false)
      setNewUser({ email: '', password: '', role: 'viewer' })
      fetchUsers()
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      showToast(error.response?.data?.error || 'Erro ao criar usuário', 'error')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const updateData: any = {}
      if (editUser.email !== selectedUser.email) updateData.email = editUser.email
      if (editUser.role !== selectedUser.role) updateData.role = editUser.role
      if (editUser.password) updateData.password = editUser.password

      await axios.put(`/api/users/${selectedUser.id}`, updateData)
      showToast('Usuário atualizado com sucesso!')
      setEditDialogOpen(false)
      setSelectedUser(null)
      setEditUser({ email: '', password: '', role: 'viewer' })
      fetchUsers()
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      showToast(error.response?.data?.error || 'Erro ao atualizar usuário', 'error')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return

    try {
      await axios.delete(`/api/users/${userId}`)
      showToast('Usuário deletado com sucesso!')
      fetchUsers()
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error)
      showToast(error.response?.data?.error || 'Erro ao deletar usuário', 'error')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditUser({
      email: user.email,
      password: '',
      role: user.role
    })
    setEditDialogOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="h-4 w-4" />
      case 'admin':
        return <Settings className="h-4 w-4" />
      case 'editor':
        return <Edit className="h-4 w-4" />
      case 'viewer':
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'editor':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando usuários...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-2">Gerencie usuários e suas permissões no sistema</p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow border">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{user.email}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditDialog(user)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Estatísticas</h4>
                  <div className="space-y-1 text-sm">
                    <div>Redes: {user._count.redes}</div>
                    <div>Hotéis: {user._count.hotels}</div>
                    <div>Posts: {user._count.posts}</div>
                  </div>
                </div>
                
                {user.redeRoles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Roles em Redes</h4>
                    <div className="space-y-1">
                      {user.redeRoles.map((redeRole, index) => (
                        <div key={index} className="text-sm">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-2">
                            {redeRole.role}
                          </span>
                          {redeRole.rede.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.hotelRoles.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Roles em Hotéis</h4>
                    <div className="space-y-1">
                      {user.hotelRoles.map((hotelRole, index) => (
                        <div key={index} className="text-sm">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-2">
                            {hotelRole.role}
                          </span>
                          {hotelRole.hotel.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Criar Novo Usuário</h2>
            <p className="text-gray-600 mb-4">Adicione um novo usuário ao sistema</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Senha do usuário"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
            <p className="text-gray-600 mb-4">Atualize as informações do usuário</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Atualizar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}