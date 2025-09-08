'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { 
  User, 
  UserCredential,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  AuthError
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

interface UserProfile {
  email: string
  displayName: string
  role: 'pending' | 'user' | 'manager' | 'admin'
  createdAt: string
  lastLogin: string
  approved?: boolean
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile
        setUserProfile(profileData)
        
        // Update last login after successfully fetching profile
        try {
          await updateDoc(doc(db, 'users', uid), {
            lastLogin: new Date().toISOString()
          })
        } catch (updateError) {
          console.error('Error updating last login:', updateError)
        }
        return true
      } else {
        // Document doesn't exist yet, this is normal for new users
        console.log('User document not found yet, will retry on next auth state change')
        return false
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return false
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const profileFound = await fetchUserProfile(user.uid)
        
        // If profile is not found, retry once after a short delay
        // This handles cases where the document creation is still in progress
        if (!profileFound) {
          setTimeout(async () => {
            await fetchUserProfile(user.uid)
          }, 500)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
      })
      
      const signInPromise = signInWithEmailAndPassword(auth, email, password)
      const userCredential = await Promise.race([signInPromise, timeoutPromise]) as UserCredential
      
      // Profile will be fetched automatically by onAuthStateChanged
    } catch (error: unknown) {
      let errorMessage = 'An error occurred during sign in'
      
      if (error instanceof Error) {
        const authError = error as AuthError
        switch (authError.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address'
          break
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network connection failed. Please check your internet connection and try again.'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password authentication is not enabled for this app'
          break
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password'
          break
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with the same email address but different sign-in credentials'
          break
        default:
          if (authError.message === 'Request timeout') {
            errorMessage = 'Request timed out. Please check your internet connection and try again.'
          } else {
            errorMessage = authError.message || errorMessage
          }
        }
      } else {
        errorMessage = 'An unknown error occurred'
      }
      
      throw new Error(errorMessage)
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
      })
      
      const signUpPromise = createUserWithEmailAndPassword(auth, email, password)
      const userCredential = await Promise.race([signUpPromise, timeoutPromise]) as UserCredential
      const user = userCredential.user
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName })
      
      // Create user profile in Firestore
      const userProfileData: UserProfile = {
        email: user.email!,
        displayName,
        role: 'pending',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        approved: false
      }
      
      await setDoc(doc(db, 'users', user.uid), userProfileData)
      setUserProfile(userProfileData)
    } catch (error: unknown) {
      let errorMessage = 'An error occurred during sign up'
      
      if (error instanceof Error) {
        const authError = error as AuthError
        switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address'
          break
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network connection failed. Please check your internet connection and try again.'
          break
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password'
          break
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with the same email address but different sign-in credentials'
          break
        default:
          if (authError.message === 'Request timeout') {
            errorMessage = 'Request timed out. Please check your internet connection and try again.'
          } else {
            errorMessage = authError.message || errorMessage
          }
        }
      } else {
        errorMessage = 'An unknown error occurred'
      }
      
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during logout'
      throw new Error(errorMessage || 'An error occurred during logout')
    }
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      await updateDoc(doc(db, 'users', user.uid), updates)
      setUserProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      throw new Error(errorMessage || 'Failed to update profile')
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signIn, 
      signUp, 
      logout, 
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
