'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Stats {
  totalUsers: number
  totalGames: number
  wonGames: number
  lostGames: number
  winRate: number
  gamesByDifficulty: Record<string, number>
}

interface User {
  id: string
  display_name: string
  xp: number
  level: number
  is_admin: boolean
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token
      if (!accessToken) {
        router.push('/')
        return
      }
      setToken(accessToken)

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${API_URL}/api/admin/users?limit=50`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.data ?? [])
      }
    })
  }, [router])

  const banUser = async (userId: string) => {
    await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_admin: false }),
    })
  }

  return (
    <main>
      <h1>Dashboard</h1>

      {stats && (
        <div>
          <h2>Overview</h2>
          <p>Users: {stats.totalUsers}</p>
          <p>Games: {stats.totalGames} (Won: {stats.wonGames}, Lost: {stats.lostGames})</p>
          <p>Win Rate: {stats.winRate}%</p>
        </div>
      )}

      <div>
        <h2>Users</h2>
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>XP</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => !search || u.display_name.toLowerCase().includes(search.toLowerCase()))
              .map(u => (
                <tr key={u.id}>
                  <td>{u.display_name}</td>
                  <td>{u.level}</td>
                  <td>{u.xp}</td>
                  <td>{u.is_admin ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => banUser(u.id)}>Ban</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
