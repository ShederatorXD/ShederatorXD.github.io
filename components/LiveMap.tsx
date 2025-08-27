"use client"

import { useEffect, useRef, useState } from 'react'

type Coords = { lat: number; lng: number }

declare global {
	interface Window { L: any }
}

export function LiveMap({
	height = 360,
	pickup,
	dropoff,
	onChange,
	onLocationData,
	center,
	enableLocate = true,
	showRoute = true,
	autoLocateOnMount = false,
	showLocationInfo = true,
}: {
	height?: number
	pickup?: Coords | null
	dropoff?: Coords | null
	onChange?: (p: { pickup?: Coords | null; dropoff?: Coords | null }) => void
	onLocationData?: (data: { pickup?: string; dropoff?: string }) => void
	center?: Coords
	enableLocate?: boolean
	showRoute?: boolean
	autoLocateOnMount?: boolean
	showLocationInfo?: boolean
}) {
	const mapRef = useRef<any>(null)
	const pickupRef = useRef<any>(null)
	const dropoffRef = useRef<any>(null)
	const routeRef = useRef<any>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [locationInfo, setLocationInfo] = useState<string>("")
	const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)

	useEffect(() => {
		const ensureLeaflet = async () => {
			if (typeof window === 'undefined') return
			if (!document.getElementById('leaflet-css')) {
				const link = document.createElement('link')
				link.id = 'leaflet-css'
				link.rel = 'stylesheet'
				link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
				document.head.appendChild(link)
			}
			if (!window.L) {
				await new Promise<void>((resolve) => {
					const s = document.createElement('script')
					s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
					s.onload = () => resolve()
					document.body.appendChild(s)
				})
			}
			if (!mapRef.current && containerRef.current && window.L) {
				const L = window.L
				const map = L.map(containerRef.current, {
					attributionControl: false,
					zoomControl: true,
					scrollWheelZoom: true,
				}).setView([center?.lat ?? 37.7749, center?.lng ?? -122.4194], 13)
				
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '',
				}).addTo(map)

				const style = document.createElement('style')
				style.textContent = `
					.leaflet-marker-icon { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
					.pickup-marker { background: #3b82f6 !important; border: 3px solid white !important; }
					.dropoff-marker { background: #ef4444 !important; border: 3px solid white !important; }
				`
				document.head.appendChild(style)

				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition((pos) => {
						map.setView([pos.coords.latitude, pos.coords.longitude], 16)
					})
				}

				map.on('click', async (e: any) => {
					const { lat, lng } = e.latlng
					const locationName = await getLocationName(lat, lng)
					setLocationInfo(locationName)
					if (!pickupRef.current) {
						const pickupIcon = L.divIcon({
							className: 'pickup-marker',
							html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #3b82f6; border: 3px solid white;"></div>',
							iconSize: [20, 20],
							iconAnchor: [10, 10]
						})
						pickupRef.current = L.marker([lat, lng], { draggable: true, icon: pickupIcon }).addTo(map)
						pickupRef.current.on('dragend', async () => {
							const p = pickupRef.current.getLatLng()
							const name = await getLocationName(p.lat, p.lng)
							setLocationInfo(name)
							onChange?.({ pickup: { lat: p.lat, lng: p.lng } })
							onLocationData?.({ pickup: name })
							updateRoute()
						})
						onChange?.({ pickup: { lat, lng } })
						onLocationData?.({ pickup: locationName })
					} else if (!dropoffRef.current) {
						const dropoffIcon = L.divIcon({
							className: 'dropoff-marker',
							html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #ef4444; border: 3px solid white;"></div>',
							iconSize: [20, 20],
							iconAnchor: [10, 10]
						})
						dropoffRef.current = L.marker([lat, lng], { draggable: true, icon: dropoffIcon }).addTo(map)
						dropoffRef.current.on('dragend', async () => {
							const d = dropoffRef.current.getLatLng()
							const name = await getLocationName(d.lat, d.lng)
							setLocationInfo(name)
							onChange?.({ dropoff: { lat: d.lat, lng: d.lng } })
							onLocationData?.({ dropoff: name })
							updateRoute()
						})
						onChange?.({ dropoff: { lat, lng } })
						onLocationData?.({ dropoff: locationName })
						if (showRoute) updateRoute()
					} else {
						map.removeLayer(pickupRef.current)
						map.removeLayer(dropoffRef.current)
						if (routeRef.current) map.removeLayer(routeRef.current)
						pickupRef.current = null
						dropoffRef.current = null
						routeRef.current = null
						onChange?.({ pickup: null, dropoff: null })
						setLocationInfo("")
					}
				})

				mapRef.current = map

				// Optionally auto-set pickup to current location on mount
				if (autoLocateOnMount && mapRef.current) {
					// Small delay to ensure map is fully rendered
					setTimeout(() => {
						if (mapRef.current) {
							setPickupToCurrent()
						}
					}, 100)
				}
			}
		}
		ensureLeaflet()
		return () => {
			if (mapRef.current) {
				mapRef.current.remove()
				mapRef.current = null
			}
		}
	}, [center, showRoute, autoLocateOnMount])

	useEffect(() => {
		const L = (typeof window !== 'undefined' && window.L) || null
		if (!L || !mapRef.current) return
		if (pickup) {
			if (!pickupRef.current) {
				const pickupIcon = L.divIcon({
					className: 'pickup-marker',
					html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #3b82f6; border: 3px solid white;"></div>',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				})
				pickupRef.current = L.marker([pickup.lat, pickup.lng], { draggable: true, icon: pickupIcon }).addTo(mapRef.current)
				pickupRef.current.on('dragend', async () => {
					const p = pickupRef.current.getLatLng()
					const name = await getLocationName(p.lat, p.lng)
					setLocationInfo(name)
					onChange?.({ pickup: { lat: p.lat, lng: p.lng } })
					onLocationData?.({ pickup: name })
					updateRoute()
				})
			} else {
				pickupRef.current.setLatLng([pickup.lat, pickup.lng])
			}
		}
		if (dropoff) {
			if (!dropoffRef.current) {
				const dropoffIcon = L.divIcon({
					className: 'dropoff-marker',
					html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #ef4444; border: 3px solid white;"></div>',
					iconSize: [20, 20],
					iconAnchor: [10, 10]
				})
				dropoffRef.current = L.marker([dropoff.lat, dropoff.lng], { draggable: true, icon: dropoffIcon }).addTo(mapRef.current)
				dropoffRef.current.on('dragend', async () => {
					const d = dropoffRef.current.getLatLng()
					const name = await getLocationName(d.lat, d.lng)
					setLocationInfo(name)
					onChange?.({ dropoff: { lat: d.lat, lng: d.lng } })
					onLocationData?.({ dropoff: name })
					updateRoute()
				})
			} else {
				dropoffRef.current.setLatLng([dropoff.lat, dropoff.lng])
			}
			if (pickupRef.current && showRoute) {
				updateRoute()
			}
		}
	}, [pickup, dropoff, showRoute])

	const getLocationName = async (lat: number, lng: number): Promise<string> => {
		try {
			const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'EcoRide-App/1.0' } })
			if (response.ok) {
				const data = await response.json()
				if (data && data.display_name) return data.display_name
			}
		} catch {}
		return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
	}

	const updateRoute = async () => {
		if (!pickupRef.current || !dropoffRef.current || !mapRef.current) {
			console.log('Map or markers not ready for route update')
			return
		}
		const L = window.L
		const pickup = pickupRef.current.getLatLng()
		const dropoff = dropoffRef.current.getLatLng()
		try {
			const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`)
			if (response.ok) {
				const data = await response.json()
				if (data.routes && data.routes.length > 0) {
					const route = data.routes.reduce((best: any, r: any) => (!best || r.distance < best.distance ? r : best), null)
					if (routeRef.current) mapRef.current.removeLayer(routeRef.current)
					routeRef.current = L.geoJSON(route.geometry, { style: { color: '#3b82f6', weight: 6, opacity: 0.8 } }).addTo(mapRef.current)
					const bounds = L.latLngBounds([pickup, dropoff])
					mapRef.current.fitBounds(bounds, { padding: [20, 20] })
					setRouteInfo({ distanceKm: Math.round((route.distance / 1000) * 10) / 10, durationMin: Math.round(route.duration / 60) })
				}
			}
		} catch {
			if (routeRef.current) mapRef.current.removeLayer(routeRef.current)
			routeRef.current = L.polyline([pickup, dropoff], { color: '#3b82f6', weight: 6, opacity: 0.8, dashArray: '10, 10' }).addTo(mapRef.current)
			const dLat = pickup.lat - dropoff.lat
			const dLng = pickup.lng - dropoff.lng
			const approxKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111
			setRouteInfo({ distanceKm: Math.round(approxKm * 10) / 10, durationMin: Math.round((approxKm / 25) * 60) })
		}
	}

	const setPickupToCurrent = () => {
		if (!navigator.geolocation || !mapRef.current) {
			console.log('Map not ready or geolocation not available')
			return
		}
		navigator.geolocation.getCurrentPosition(async (pos) => {
			const lat = pos.coords.latitude
			const lng = pos.coords.longitude
			if (mapRef.current) {
				mapRef.current.setView([lat, lng], 16)
				const name = await getLocationName(lat, lng)
				setLocationInfo(name)
				const L = window.L
				if (!pickupRef.current) {
					const pickupIcon = L.divIcon({
						className: 'pickup-marker',
						html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #3b82f6; border: 3px solid white;"></div>',
						iconSize: [20, 20],
						iconAnchor: [10, 10]
					})
					pickupRef.current = L.marker([lat, lng], { draggable: true, icon: pickupIcon }).addTo(mapRef.current)
					pickupRef.current.on('dragend', async () => {
						const p = pickupRef.current.getLatLng()
						const n = await getLocationName(p.lat, p.lng)
						setLocationInfo(n)
						onChange?.({ pickup: { lat: p.lat, lng: p.lng } })
						onLocationData?.({ pickup: n })
						updateRoute()
					})
				} else {
					pickupRef.current.setLatLng([lat, lng])
				}
				onChange?.({ pickup: { lat, lng } })
				onLocationData?.({ pickup: name })
			}
		}, () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
	}

	return (
		<div style={{ position: 'relative' }}>
			{enableLocate && (
				<button type="button" onClick={setPickupToCurrent} style={{ position: 'absolute', zIndex: 1000, top: 8, right: 8, background: 'white', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', fontSize: 12, cursor: 'pointer', border: 'none' }}>📍 Use my location</button>
			)}
			{routeInfo && (
				<div style={{ position: 'absolute', zIndex: 1000, top: 8, left: 8, background: 'white', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', fontSize: 12, border: '1px solid #e5e7eb' }}>
					<strong>Route:</strong> {routeInfo.distanceKm} km • {routeInfo.durationMin} min
				</div>
			)}
			{showLocationInfo && locationInfo && (
				<div style={{ position: 'absolute', zIndex: 1000, bottom: 8, left: 8, right: 8, background: 'white', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', fontSize: 12, border: '1px solid #e5e7eb' }}>
					<div style={{ fontWeight: 'bold', marginBottom: '2px' }}>📍 Selected Location</div>
					<div style={{ color: '#666', fontSize: '11px' }}>{locationInfo}</div>
				</div>
			)}
			<div ref={containerRef} style={{ width: '100%', height }} />
		</div>
	)
}


