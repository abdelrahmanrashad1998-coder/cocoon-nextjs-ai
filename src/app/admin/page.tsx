'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Check, X, Clock } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'

interface UserProfile {
  id: string
  email: string
  displayName: string
  role: 'pending' | 'user' | 'manager' | 'admin'
  createdAt: string
  lastLogin: string
  approved?: boolean
}

export default function AdminPage() {
  const { userProfile } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchPendingUsers()
    }
  }, [userProfile])

  const fetchPendingUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'pending'))
      const querySnapshot = await getDocs(q)
      const users: UserProfile[] = []
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile)
      })
      setPendingUsers(users)
    } catch (error) {
      console.error('Error fetching pending users:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'user',
        approved: true
      })
      await fetchPendingUsers() // Refresh the list
    } catch (error) {
      console.error('Error approving user:', error)
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'guest',
        approved: false
      })
      await fetchPendingUsers() // Refresh the list
    } catch (error) {
      console.error('Error rejecting user:', error)
    }
  }

  if (userProfile?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don&apos;t have permission to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user approvals and roles
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>
                Review and approve new user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending users to approve
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{user.displayName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-warning/10 text-warning-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                              className="bg-success hover:bg-success/90"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectUser(user.id)}
                              className="border-destructive/20 text-destructive hover:bg-destructive/5"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
