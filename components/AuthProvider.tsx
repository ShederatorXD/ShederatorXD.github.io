"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type AuthState = {
	token: string | null
	user: { id: string; name: string; email: string; ecoPoints: number; badges: string[]; role: string; avatarUrl?: string | null } | null
	loading: boolean
	login: (email: string, password: string) => Promise<void>
	signup: (name: string, email: string, phone: string | undefined, password: string) => Promise<void>
	logout: () => void
	refreshUserData: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

async function fetchProfile(userId: string) {
	try {
		const { data, error } = await supabase.from('profiles').select('id,name,role,eco_points,badges,phone,avatar_url,banned').eq('id', userId).maybeSingle()
		if (error) {
			console.log('Error fetching profile:', error.message)
			return null
		}
		return data
	} catch (error) {
		console.error('Error fetching profile:', error)
		return null
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(null)
	const [user, setUser] = useState<AuthState['user']>(null)
	const [loading, setLoading] = useState(true)

	// Simple initialization - ensure KIIT domain gets admin role
	useEffect(() => {
		const init = async () => {
			try {
				const { data } = await supabase.auth.getSession()
				const session = data.session
				if (session) {
					localStorage.setItem('token', session.access_token)
					setToken(session.access_token)
					const profile = await fetchProfile(session.user.id)
					if (profile) {
						const isKiit = !!session.user.email?.endsWith('@kiit.ac.in')
						const resolvedRole = isKiit ? 'admin' : (profile.role || 'rider')
						setUser({
							id: session.user.id,
							name: profile.name || session.user.email || 'User',
							email: session.user.email || '',
							ecoPoints: profile.eco_points ?? 0,
							badges: profile.badges ?? [],
							role: resolvedRole,
							avatarUrl: profile.avatar_url ?? null,
						})
						if (isKiit && profile.role !== 'admin') {
							await supabase.from('profiles').update({ role: 'admin' }).eq('id', session.user.id)
						}
					}
				}
			} catch (error) {
				console.error('Error in init:', error)
			} finally {
				setLoading(false)
			}
		}
		init()
	}, [])

	// Simple auth state change listener
	useEffect(() => {
		const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
			if (session) {
				localStorage.setItem('token', session.access_token)
				setToken(session.access_token)
				const profile = await fetchProfile(session.user.id)
				if (profile) {
					setUser({
						id: session.user.id,
						name: profile.name || session.user.email || 'User',
						email: session.user.email || '',
						ecoPoints: profile.eco_points ?? 0,
						badges: profile.badges ?? [],
						role: (session.user.email?.endsWith('@kiit.ac.in') ? 'admin' : (profile.role || 'rider')),
						avatarUrl: profile.avatar_url ?? null,
					})
					// If email is kiit.ac.in and role not admin, promote in DB
					if (session.user.email?.endsWith('@kiit.ac.in') && profile.role !== 'admin') {
						await supabase.from('profiles').update({ role: 'admin' }).eq('id', session.user.id)
					}
					if ((profile as any).banned) {
						window.location.href = '/banned'
					}
				}
			} else {
				localStorage.removeItem('token')
				setToken(null)
				setUser(null)
			}
			setLoading(false)
		})
		
		return () => {
			sub.subscription.unsubscribe()
		}
	}, [])

	const login = async (email: string, password: string) => {
		console.log('=== LOGIN START ===', { email })
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password })
			if (error) {
				console.error('Login error:', error)
				throw new Error(error.message)
			}
			
			const session = data.session
			if (!session) {
				throw new Error('No session returned')
			}
			
			console.log('Login successful, fetching profile...')
			
			// Set token first
			localStorage.setItem('token', session.access_token)
			setToken(session.access_token)
			
			// Fetch profile
			const profile = await fetchProfile(session.user.id)
			if (profile) {
				const isKiitLogin = !!session.user.email?.endsWith('@kiit.ac.in')
				const resolvedLoginRole = isKiitLogin ? 'admin' : (profile.role || 'rider')
				setUser({
					id: session.user.id,
					name: profile.name || session.user.email || 'User',
					email: session.user.email || '',
					ecoPoints: profile.eco_points ?? 0,
					badges: profile.badges ?? [],
					role: resolvedLoginRole,
					avatarUrl: profile.avatar_url ?? null,
				})
				if (isKiitLogin && profile.role !== 'admin') {
					await supabase.from('profiles').update({ role: 'admin' }).eq('id', session.user.id)
				}
			} else {
				// Create profile if it doesn't exist (assign admin for KIIT domain)
				console.log('Profile not found, creating one...')
				const isKiitLogin = !!session.user.email?.endsWith('@kiit.ac.in')
				const initialRole = isKiitLogin ? 'admin' : 'rider'
				const { error: createError } = await supabase.from('profiles').upsert({ 
					id: session.user.id, 
					name: session.user.email?.split('@')[0] || 'User', 
					role: initialRole, 
					eco_points: 0, 
					badges: [], 
					phone: null 
				})
				
				if (createError) {
					console.error('Failed to create profile:', createError)
				} else {
					setUser({
						id: session.user.id,
						name: session.user.email?.split('@')[0] || 'User',
						email: session.user.email || '',
						ecoPoints: 0,
						badges: [],
						role: initialRole,
						avatarUrl: null,
					})
				}
			}
			
			console.log('=== LOGIN END ===')
		} catch (error) {
			console.error('Login failed:', error)
			throw error
		}
	}

	const signup = async (name: string, email: string, phone: string | undefined, password: string) => {
		console.log('=== SIGNUP START ===', { name, email, phone: phone ? 'present' : 'missing' })
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { name, phone } },
			})
			
			if (error) {
				console.error('Signup error:', error)
				throw new Error(error.message)
			}
			
			console.log('Signup successful:', { 
				userId: data.user?.id, 
				session: !!data.session 
			})
			
			const session = data.session
			if (data.user?.id) {
				// Create profile (domain-based role)
				console.log('Creating user profile...')
				const isKiit = !!email.endsWith('@kiit.ac.in')
				const initialRole = isKiit ? 'admin' : 'rider'
				const { error: profileError } = await supabase.from('profiles').upsert({ 
					id: data.user.id, 
					name, 
					role: initialRole, 
					eco_points: 0, 
					badges: [], 
					phone 
				})
				
				if (profileError) {
					console.error('Profile creation error:', profileError)
				} else {
					console.log('Profile created successfully')
				}
			}
			
			if (session) {
				console.log('Setting session data...')
				localStorage.setItem('token', session.access_token)
				setToken(session.access_token)
				const isKiit = !!email.endsWith('@kiit.ac.in')
				setUser({ 
					id: session.user.id, 
					name: name || email, 
					email, 
					ecoPoints: 0, 
					badges: [], 
					role: isKiit ? 'admin' : 'rider',
					avatarUrl: null
				})
			}
			
			console.log('=== SIGNUP END ===')
		} catch (error) {
			console.error('Signup failed:', error)
			throw error
		}
	}

	const logout = async () => {
		await supabase.auth.signOut()
		localStorage.removeItem('token')
		setToken(null)
		setUser(null)
	}

	const refreshUserData = async () => {
		if (!token) return
		try {
			const { data } = await supabase.auth.getSession()
			const session = data.session
			if (session) {
				const profile = await fetchProfile(session.user.id)
				if (profile) {
					setUser({
						id: session.user.id,
						name: profile.name || session.user.email || 'User',
						email: session.user.email || '',
						ecoPoints: profile.eco_points ?? 0,
						badges: profile.badges ?? [],
						role: (session.user.email?.endsWith('@kiit.ac.in') ? 'admin' : (profile.role || 'rider')),
						avatarUrl: profile.avatar_url ?? null,
					})
					if (session.user.email?.endsWith('@kiit.ac.in') && profile.role !== 'admin') {
						await supabase.from('profiles').update({ role: 'admin' }).eq('id', session.user.id)
					}
					if ((profile as any).banned) {
						window.location.href = '/banned'
					}
				}
			}
		} catch (error) {
			console.error('Error refreshing user data:', error)
		}
	}

	const value = useMemo<AuthState>(() => ({ 
		token, 
		user, 
		loading, 
		login, 
		signup, 
		logout, 
		refreshUserData 
	}), [token, user, loading])

	return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthCtx)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}


