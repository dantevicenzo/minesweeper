'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '../../lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Stats {
  totalUsers: number
  totalGames: number
  wonGames: number
  lostGames: number
  winRate: number
  gamesByDifficulty: Record<string, number>
  topPlayers: Array<{ username: string; xp: number }>
}

interface User {
  id: string
  username: string
  full_name: string | null
  email: string | null
  xp: number
  level: number
  is_admin: boolean
  banned: boolean
  banned_at: string | null
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (pageNum: number, searchTerm: string) => {
    if (!token) return
    setLoading(true)

    const params = new URLSearchParams({ page: String(pageNum), limit: '20' })
    if (searchTerm) params.set('search', searchTerm)

    const [statsRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    if (statsRes.ok) setStats(await statsRes.json())
    if (usersRes.ok) {
      const data = await usersRes.json()
      setUsers(data.data ?? [])
      setPagination(data.pagination)
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token
      if (!accessToken) {
        router.push('/')
        return
      }
      setToken(accessToken)
    })
  }, [router])

  useEffect(() => {
    if (token) fetchData(pagination.page, search)
  }, [token, fetchData])

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }))
    fetchData(1, search)
  }

  const handlePageChange = (newPage: number) => {
    setPagination(p => ({ ...p, page: newPage }))
    fetchData(newPage, search)
  }

  const toggleBan = async (user: User) => {
    const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ banned: !user.banned }),
    })

    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: !user.banned, banned_at: !user.banned ? new Date().toISOString() : null } : u))

      const [statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
    }
  }

  const toggleAdmin = async (user: User) => {
    const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_admin: !user.is_admin }),
    })

    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !user.is_admin } : u))
    }
  }

  return (
    <main>
      <h1>Dashboard</h1>

      {stats && (
        <div style={{ marginBottom: 32 }}>
          <h2>Overview</h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 120 }}>
              <strong>{stats.totalUsers}</strong><br /><small>Users</small>
            </div>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 120 }}>
              <strong>{stats.totalGames}</strong><br /><small>Total Games</small>
            </div>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 120 }}>
              <strong>{stats.wonGames}</strong><br /><small>Won</small>
            </div>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 120 }}>
              <strong>{stats.lostGames}</strong><br /><small>Lost</small>
            </div>
            <div style={{ background: 'white', padding: 16, borderRadius: 8, minWidth: 120 }}>
              <strong>{stats.winRate}%</strong><br /><small>Win Rate</small>
            </div>
          </div>

          <h3 style={{ marginTop: 16 }}>Top Players</h3>
          <ol>
            {stats.topPlayers.map((p, i) => (
              <li key={i}>{p.username} — {p.xp} XP</li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <h2>Users</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Search by username, email, or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.banned ? 0.5 : 1 }}>
                    <td>{u.username}<br /><small>{u.email}</small></td>
                    <td>{u.level}</td>
                    <td>{u.xp}</td>
                    <td>
                      <button
                        onClick={() => toggleAdmin(u)}
                        style={{ background: u.is_admin ? '#d4edda' : undefined }}
                      >
                        {u.is_admin ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      {u.banned ? (
                        <span style={{ color: 'red' }}>Banned {u.banned_at ? new Date(u.banned_at).toLocaleDateString() : ''}</span>
                      ) : (
                        <span style={{ color: 'green' }}>Active</span>
                      )}
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => toggleBan(u)}
                        style={{ background: u.banned ? '#fff3cd' : '#f8d7da' }}
                      >
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    style={{ fontWeight: p === pagination.page ? 'bold' : 'normal' }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}

            <p style={{ marginTop: 8, color: '#666' }}>
              Showing {users.length} of {pagination.total} users (page {pagination.page} of {pagination.totalPages})
            </p>
          </>
        )}
      </div>
    </main>
  )
}
