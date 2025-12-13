'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useClient } from 'sanity'
import imageUrlBuilder, { type SanityImageSource } from '@sanity/image-url'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Select,
  Spinner,
  Stack,
  Tab,
  TabPanel,
  Text,
  TextInput,
  Tooltip,
  Badge,
  TextArea,
} from '@sanity/ui'
import {
  Search,
  ImageIcon,
  DollarSign,
  MapPin,
  Settings,
  Save,
  Check,
  AlertCircle,
  Info,
  Utensils,
  FileText,
  Hash,
  ChevronRight,
  Upload,
  X,
  Wand2,
} from 'lucide-react'

// Types
interface LocationDoc {
  _id: string
  name: string
  slug?: { current?: string }
}

interface LocationOverride {
  _key?: string
  location?: { _type: 'reference'; _ref?: string }
  price?: number
  available?: boolean
}

interface MenuItemLite {
  _id: string
  name: string
  categoryTitle?: string
  categorySlug?: string
  basePrice?: number
  source?: string
  image?: SanityImageSource
  imageUrl?: string
  availableEverywhere?: boolean
  locationOverrides?: LocationOverride[]
}

interface CategoryLite {
  _id: string
  title: string
  slug?: { current?: string }
}

interface MenuItemDetail {
  _id: string
  name?: string
  slug?: { _type: 'slug'; current?: string }
  description?: string
  basePrice?: number
  category?: { _type: 'reference'; _ref: string }
  availableEverywhere?: boolean
  locationOverrides?: LocationOverride[]
  source?: string
  externalId?: string
  image?: SanityImageSource
  imageUrl?: string
}

const createKey = () => Math.random().toString(36).slice(2, 10)

/**
 * Apply standardized formatting rules to menu item names
 * Conservative - preserves capitalization for menu item titles
 */
function formatMenuItemName(name: string): string {
  if (!name) return name

  let fixed = name.trim()
  fixed = fixed.replace(/^,\s*/, '')

  // Remove markdown formatting
  fixed = fixed.replace(/\*\*(fried|Fried|grilled|Grilled|blackened|Blackened)\*\*/gi, (_, word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  )

  // Fix measurements
  fixed = fixed.replace(/(\d+(?:\/\d+)?)\s*(?:LB|Pound|Pounds?)\b/gi, (_, num) => `${num}lb`)
  fixed = fixed.replace(/(\d+\/\d+)\s+(lb|oz)\b/gi, '$1$2')

  // "Jumbo Shrimp" always capitalized
  fixed = fixed.replace(/\bjumbo shrimp\b/gi, 'Jumbo Shrimp')

  // Fix incomplete protein lists: "Catfish (8) & 12 jumbo shrimp"
  fixed = fixed.replace(
    /([A-Z][a-z]+)\s*\((\d+)\)\s*(&|,)\s*(\d+)\s+(jumbo shrimp)/gi,
    (_, protein1, num1, separator, num2) => `${protein1} (${num1}) ${separator} Jumbo Shrimp (${num2})`
  )

  // Fix "Jumbo shrimp (4)" → "Jumbo Shrimp (4)"
  fixed = fixed.replace(/\bJumbo shrimp\b/g, 'Jumbo Shrimp')

  // Fix lowercase "tenders" → "Tenders"
  fixed = fixed.replace(/\btenders\b/g, 'Tenders')

  // Fix "fried oysters" → "Fried Oysters" in names
  fixed = fixed.replace(/\bfried oysters\b/gi, 'Fried Oysters')

  // Monterey Jack spelling
  fixed = fixed.replace(/\bMonterrey Jack\b/gi, 'Monterey Jack')

  // Étouffée handling
  fixed = fixed.replace(/\bShrimp étouffée\b/g, 'Shrimp Étouffée')
  fixed = fixed.replace(/\bShrimp Etouffee\b/gi, 'Shrimp Étouffée')

  return fixed
}

/**
 * Apply standardized formatting rules to menu item descriptions
 * More aggressive formatting for descriptions
 */
function formatMenuItemDescription(desc: string): string {
  if (!desc) return desc

  let fixed = desc.trim()
  fixed = fixed.replace(/^,\s*/, '')

  // Remove markdown formatting
  fixed = fixed.replace(/\*\*(fried|Fried|grilled|Grilled|blackened|Blackened)\*\*/gi, (_, word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  )

  // Remove trailing period from single sentences
  const periodCount = (fixed.match(/\./g) || []).length
  if (periodCount === 1 && fixed.endsWith('.')) {
    fixed = fixed.slice(0, -1)
  }

  // Fix measurements
  fixed = fixed.replace(/(\d+(?:\/\d+)?)\s*(?:LB|Pound|Pounds?)\b/gi, (_, num) => `${num}lb`)
  fixed = fixed.replace(/(\d+\/\d+)\s+(lb|oz)\b/gi, '$1$2')

  // "Jumbo Shrimp" always capitalized
  fixed = fixed.replace(/\bjumbo shrimp\b/gi, 'Jumbo Shrimp')

  // Ensure main proteins are capitalized
  fixed = fixed.replace(/\b(catfish|whitefish|shrimp|oysters?|crawfish|gator|chicken)\b/gi, (match) =>
    match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
  )

  // Cooking methods in parentheses should be lowercase
  fixed = fixed.replace(
    /\((Fried|Grilled|Blackened|Boiled)(,?\s+(Fried|Grilled|Blackened|Boiled|or))*\)/gi,
    (match) => match.toLowerCase()
  )

  // Monterey Jack spelling and cheese lowercase
  fixed = fixed.replace(/\bMonterrey Jack\b/gi, 'Monterey Jack')
  fixed = fixed.replace(/\bMonterey Jack Cheese\b/gi, 'Monterey Jack cheese')

  // Étouffée handling
  fixed = fixed.replace(/\bShrimp étouffée\b/g, 'Shrimp Étouffée')
  fixed = fixed.replace(/\bShrimp Etouffee\b/gi, 'Shrimp Étouffée')

  // Generic terms to lowercase in descriptions
  const lowercaseTerms = [
    ['Side Item', 'side item'],
    ['Diced Tomato', 'diced tomato'],
    ['Green Onion', 'green onion'],
    ['Bacon Bits', 'bacon bits'],
    ['Sour Cream', 'sour cream'],
    ['Garlic Bread', 'garlic bread'],
    ['Green Bell Peppers', 'green bell peppers'],
    ['Bed of', 'bed of'],
    ['Queso', 'queso'],
  ] as const

  lowercaseTerms.forEach(([term, replacement]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'g')
    fixed = fixed.replace(regex, replacement)
  })

  // Lowercase "filet"
  fixed = fixed.replace(/\bFilets?\b/g, (match) => match.toLowerCase())

  return fixed
}

// iOS-style toggle switch (larger, pill-shaped like iOS 26)
function IOSToggle({
  checked,
  onChange,
  size = 'default'
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'small' | 'default'
}) {
  // Sizes based on iOS 26 pill toggle dimensions
  const dimensions = size === 'small'
    ? { width: 44, height: 26, handle: 20, padding: 3 }
    : { width: 51, height: 31, handle: 27, padding: 2 }

  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-block',
        width: dimensions.width,
        height: dimensions.height,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          opacity: 0,
          width: 0,
          height: 0,
          position: 'absolute',
        }}
      />
      <span
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#34C759' : '#E5E5EA',
          borderRadius: dimensions.height,
          transition: 'background-color 0.2s cubic-bezier(.2,.6,.2,1)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            content: '""',
            height: dimensions.handle,
            width: dimensions.handle,
            left: checked ? dimensions.width - dimensions.handle - dimensions.padding : dimensions.padding,
            top: dimensions.padding,
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: 'left 0.2s cubic-bezier(.2,.6,.2,1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
          }}
        />
      </span>
    </label>
  )
}

// Tooltip wrapper component
function HelpTooltip({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <Tooltip
      content={
        <Box padding={2} style={{ maxWidth: 240 }}>
          <Text size={1}>{content}</Text>
        </Box>
      }
      placement="top"
      portal
    >
      <span style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {children}
        <Info size={13} style={{ opacity: 0.5 }} />
      </span>
    </Tooltip>
  )
}

// Field label with optional tooltip
function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  const labelContent = (
    <Text size={1} weight="medium" style={{ color: 'var(--card-muted-fg-color)' }}>
      {label}
    </Text>
  )

  if (tooltip) {
    return <HelpTooltip content={tooltip}>{labelContent}</HelpTooltip>
  }

  return labelContent
}

// Menu item card in the list
function ListItem({
  item,
  selected,
  onSelect,
  imageUrl
}: {
  item: MenuItemLite
  selected: boolean
  onSelect: () => void
  imageUrl?: string
}) {
  return (
    <Card
      padding={3}
      radius={2}
      shadow={selected ? 1 : 0}
      tone={selected ? 'primary' : 'default'}
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        border: selected ? '2px solid var(--card-focus-ring-color)' : '1px solid var(--card-border-color)',
        background: selected ? 'var(--card-bg-color)' : 'transparent',
      }}
    >
      <Flex gap={3} align="center">
        {/* Thumbnail */}
        <Box style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--card-skeleton-color-from)',
        }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Flex align="center" justify="center" style={{ width: '100%', height: '100%' }}>
              <ImageIcon size={20} style={{ opacity: 0.3 }} />
            </Flex>
          )}
        </Box>

        {/* Content */}
        <Stack space={2} style={{ flex: 1 }}>
          <Text weight="medium" size={1}>
            {item.name}
          </Text>
          <Flex gap={2} align="center" wrap="wrap">
            {item.categoryTitle && (
              <Badge tone="primary" fontSize={0} padding={1}>
                {item.categoryTitle}
              </Badge>
            )}
            {item.basePrice != null && (
              <Text size={1} muted style={{ fontFamily: 'monospace' }}>
                ${item.basePrice.toFixed(2)}
              </Text>
            )}
          </Flex>
        </Stack>

        {selected && (
          <ChevronRight size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
        )}
      </Flex>
    </Card>
  )
}

// Compact location row for the two-column table
function LocationRow({
  location,
  available,
  hasOverride,
  currentPrice,
  basePrice,
  onAvailabilityToggle,
  onPriceChange
}: {
  location: LocationDoc
  available: boolean
  hasOverride: boolean
  currentPrice?: number
  basePrice?: number
  onAvailabilityToggle: (available: boolean) => void
  onPriceChange: (value: string) => void
}) {
  // Extract short name (remove "The Catch — " prefix if present)
  const shortName = location.name.replace(/^The Catch\s*[—–-]\s*/i, '')

  return (
    <Flex
      align="center"
      gap={2}
      padding={2}
      style={{
        borderBottom: '1px solid var(--card-border-color)',
        background: available ? 'color-mix(in srgb, var(--card-bg-color) 92%, var(--card-badge-positive-bg-color))' : 'transparent',
        opacity: available ? 1 : 0.6,
      }}
    >
      {/* Availability Toggle */}
      <Tooltip
        content={
          <Box padding={2}>
            <Text size={1}>{available ? 'Available at this location' : 'Not offered here'}</Text>
          </Box>
        }
        placement="top"
        portal
      >
        <Box style={{ flexShrink: 0 }}>
          <IOSToggle
            checked={available}
            onChange={onAvailabilityToggle}
            size="small"
          />
        </Box>
      </Tooltip>

      {/* Location name */}
      <Box style={{ flex: 1 }}>
        <Text size={1} weight={available ? 'medium' : 'regular'} style={{ opacity: available ? 1 : 0.7 }}>
          {shortName}
        </Text>
      </Box>

      {/* Price input - compact */}
      <Box style={{ width: 72, flexShrink: 0 }}>
        <TextInput
          type="number"
          step="0.01"
          value={hasOverride && typeof currentPrice === 'number' ? String(currentPrice) : ''}
          placeholder={basePrice != null ? basePrice.toFixed(2) : '—'}
          disabled={!available}
          onChange={(e) => onPriceChange(e.currentTarget.value)}
          fontSize={1}
          padding={2}
          style={{
            fontFamily: 'monospace',
            textAlign: 'right',
            opacity: available ? 1 : 0.4,
          }}
        />
      </Box>
    </Flex>
  )
}

// Save status indicator
function SaveStatus({ saving, saved, error }: { saving: boolean; saved: boolean; error?: string }) {
  if (error) {
    return (
      <Flex align="center" gap={2}>
        <AlertCircle size={14} style={{ color: 'var(--card-badge-critical-dot-color)' }} />
        <Text size={1} style={{ color: 'var(--card-badge-critical-dot-color)' }}>{error}</Text>
      </Flex>
    )
  }

  if (saving) {
    return (
      <Flex align="center" gap={2}>
        <Spinner muted />
        <Text size={1} muted>Saving...</Text>
      </Flex>
    )
  }

  if (saved) {
    return (
      <Flex align="center" gap={2}>
        <Check size={14} style={{ color: 'var(--card-badge-positive-dot-color)' }} />
        <Text size={1} style={{ color: 'var(--card-badge-positive-dot-color)' }}>Saved</Text>
      </Flex>
    )
  }

  return null
}

// Main component
export function MenuManagerPane() {
  const client = useClient({ apiVersion: '2023-08-01' })
  const imageBuilder = useMemo(() => imageUrlBuilder(client), [client])

  const [items, setItems] = useState<MenuItemLite[]>([])
  const [categories, setCategories] = useState<CategoryLite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [locationFilter, setLocationFilter] = useState<string>('') // '' means all locations
  const [showUnlisted, setShowUnlisted] = useState(false) // Show items NOT at selected location
  const [tab, setTab] = useState(0)
  const [detail, setDetail] = useState<MenuItemDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [locations, setLocations] = useState<LocationDoc[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [locationsError, setLocationsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Image URL helper
  const getImageUrl = useCallback((source?: SanityImageSource, fallbackUrl?: string) => {
    if (source) {
      try {
        return imageBuilder.image(source).width(200).height(200).fit('crop').url()
      } catch {
        // Fall through to fallback
      }
    }
    return fallbackUrl || undefined
  }, [imageBuilder])

  // Load items and categories
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [itemsResp, catsResp] = await Promise.all([
          client.fetch(
            `*[_type == "menuItem" && !(_id in path('drafts.**'))]{
              _id, name, basePrice, source, image, imageUrl, availableEverywhere,
              category->{title,slug},
              locationOverrides
            }|order(name asc)`
          ),
          client.fetch(`*[_type == "menuCategory"]|order(position asc){_id,title,slug}`),
        ])
        if (!cancelled) {
          setItems(
            itemsResp.map((i: MenuItemLite & { category?: { title?: string; slug?: { current?: string } } }) => ({
              _id: i._id,
              name: i.name,
              basePrice: i.basePrice,
              source: i.source,
              image: i.image,
              imageUrl: i.imageUrl,
              availableEverywhere: i.availableEverywhere,
              categoryTitle: i.category?.title,
              categorySlug: i.category?.slug?.current,
              locationOverrides: i.locationOverrides,
            }))
          )
          setCategories(catsResp)
          setLoading(false)
          if (itemsResp[0]) setSelectedId(itemsResp[0]._id)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load items')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [client])

  // Load item detail
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    async function loadDetail() {
      setDetailLoading(true)
      setDetailError(null)
      setSaved(false)
      setSaveError(null)
      try {
        const doc = await client.fetch<MenuItemDetail>(
          `*[_id == $id][0]{
            _id, name, slug, description, basePrice, category,
            availableEverywhere, locationOverrides, source, externalId, image, imageUrl
          }`,
          { id: selectedId }
        )
        if (!cancelled) {
          setDetail(doc)
          setDetailLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : 'Failed to load item')
          setDetailLoading(false)
        }
      }
    }
    loadDetail()
    return () => { cancelled = true }
  }, [client, selectedId])

  // Load locations
  useEffect(() => {
    let cancelled = false
    async function loadLocations() {
      setLocationsLoading(true)
      setLocationsError(null)
      try {
        const locs = await client.fetch<LocationDoc[]>(`*[_type == "location"]|order(name asc){_id,name,slug}`)
        if (!cancelled) {
          setLocations(locs || [])
          setLocationsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setLocationsError(err instanceof Error ? err.message : 'Failed to load locations')
          setLocationsLoading(false)
        }
      }
    }
    loadLocations()
    return () => { cancelled = true }
  }, [client])

  // Computed values
  const overrides = useMemo(() => {
    if (!detail?.locationOverrides || !Array.isArray(detail.locationOverrides)) return []
    return detail.locationOverrides as LocationOverride[]
  }, [detail?.locationOverrides])

  const groupedLocations = useMemo(() => {
    // DFW includes Burleson (Wichita Falls moved to Other)
    const dfwKeywords = ['dallas', 'fort worth', 'dfw', 'denton', 'garland', 'frisco', 'plano', 'arlington', 'irving', 'mckinney', 'coit', 'campbell', 'burleson']
    // Houston includes South Post Oak, Willowbrook
    const houstonKeywords = ['houston', 'katy', 'sugar land', 'woodlands', 'pearland', 'spring', 'clear lake', 'atascocita', 'humble', 'conroe', 'south post oak', 'willowbrook']
    // Oklahoma: OKC Memorial, Moore, Midwest City
    const oklahomaKeywords = ['okc', 'oklahoma', 'moore', 'midwest city', 'memorial']

    const dfw: LocationDoc[] = []
    const houston: LocationDoc[] = []
    const oklahoma: LocationDoc[] = []
    const other: LocationDoc[] = []

    for (const loc of locations) {
      const nameLower = loc.name.toLowerCase()
      const slugLower = loc.slug?.current?.toLowerCase() || ''

      if (dfwKeywords.some(k => nameLower.includes(k) || slugLower.includes(k))) {
        dfw.push(loc)
      } else if (houstonKeywords.some(k => nameLower.includes(k) || slugLower.includes(k))) {
        houston.push(loc)
      } else if (oklahomaKeywords.some(k => nameLower.includes(k) || slugLower.includes(k))) {
        oklahoma.push(loc)
      } else {
        other.push(loc)
      }
    }

    // Return in specific order: DFW, Houston (left column), Oklahoma, Other (right column)
    return [
      { title: 'Dallas-Fort Worth', items: dfw, column: 'left' },
      { title: 'Houston', items: houston, column: 'left' },
      { title: 'Oklahoma', items: oklahoma, column: 'right' },
      { title: 'Other', items: other, column: 'right' },
    ].filter((g) => g.items.length > 0)
  }, [locations])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = search ? item.name.toLowerCase().includes(search.toLowerCase()) : true
      const matchesCat = categoryFilter ? item.categorySlug === categoryFilter : true

      // Location filter: check if item is available at the selected location
      // Matches lib/utils/menuAvailability.ts OPT-IN MODEL:
      // - If availableEverywhere === true: always available (no per-location opt-out)
      // - Otherwise: must have explicit available: true for this location
      let isAvailable = true
      if (locationFilter) {
        if (item.availableEverywhere === true) {
          // Universal items show everywhere - no per-location opt-out
          isAvailable = true
        } else {
          // OPT-IN: must have explicit available: true
          const overrides = item.locationOverrides || []
          const locationOverride = overrides.find(ov => ov.location?._ref === locationFilter)
          isAvailable = locationOverride?.available === true
        }
      }

      // When showUnlisted is true and a location is selected, show items NOT at that location
      const matchesLocation = locationFilter
        ? (showUnlisted ? !isAvailable : isAvailable)
        : true

      return matchesSearch && matchesCat && matchesLocation
    })
  }, [items, search, categoryFilter, locationFilter, showUnlisted])

  // Handlers
  const upsertOverride = (locationId: string, updater: (current?: LocationOverride) => LocationOverride | null) => {
    if (!detail) return
    const current = overrides.find((ov) => ov.location?._ref === locationId)
    let next = updater(current)

    // Remove semantically redundant overrides (centralized logic)
    // In opt-in mode (availableEverywhere !== true):
    //   - available: false with no price is redundant (that's the default)
    // In opt-out mode (availableEverywhere === true):
    //   - available: true with no price is redundant (that's the default)
    if (next) {
      const hasPrice = typeof next.price === 'number'
      const isRedundant = detail.availableEverywhere === true
        ? next.available === true && !hasPrice
        : next.available === false && !hasPrice
      if (isRedundant) {
        next = null
      }
    }

    const remaining = overrides.filter((ov) => ov.location?._ref !== locationId)
    const nextArray = next ? [...remaining, next] : remaining
    setDetail((d) => (d ? { ...d, locationOverrides: nextArray.length ? nextArray : undefined } : d))
    setSaved(false)
  }

  const handleAvailabilityToggle = (locationId: string, available: boolean) => {
    // In opt-out mode (availableEverywhere === true), toggling off is not supported
    // Items are always available at all locations when availableEverywhere is enabled
    if (detail?.availableEverywhere === true && available === false) {
      return  // Ignore attempts to toggle off in opt-out mode
    }

    upsertOverride(locationId, (current) => ({
      _key: current?._key || createKey(),
      location: { _type: 'reference', _ref: locationId },
      available,
      price: current?.price,
    }))
  }

  const handlePriceChange = (locationId: string, value: string) => {
    const nextPrice = value === '' ? undefined : parseFloat(value)
    if (nextPrice !== undefined && Number.isNaN(nextPrice)) return
    upsertOverride(locationId, (current) => ({
      _key: current?._key || createKey(),
      location: { _type: 'reference', _ref: locationId },
      available: current?.available ?? true,
      price: nextPrice,
    }))
  }

  // Image upload handler
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !detail?._id) return

    setUploading(true)
    try {
      const imageAsset = await client.assets.upload('image', file, {
        filename: file.name,
      })
      // Update local state with the new image reference
      setDetail((d) => d ? {
        ...d,
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id,
          },
        } as SanityImageSource,
      } : d)
      setSaved(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setDetail((d) => d ? { ...d, image: undefined, imageUrl: undefined } : d)
    setSaved(false)
  }

  const save = async () => {
    if (!detail?._id) return
    setSaving(true)
    setSaveError(null)
    try {
      const patch = client.patch(detail._id).set({
        name: detail.name,
        slug: detail.slug,
        description: detail.description,
        basePrice: detail.basePrice,
        category: detail.category,
        availableEverywhere: detail.availableEverywhere,
        locationOverrides: detail.locationOverrides,
        source: detail.source,
        externalId: detail.externalId,
        image: detail.image,
      })

      // If image was removed, unset it
      if (!detail.image) {
        patch.unset(['image', 'imageUrl'])
      }

      await patch.commit({ autoGenerateArrayKeys: true })
      setSaved(true)
      setSaving(false)
      // Update list item with saved values
      setItems(prev => prev.map(item =>
        item._id === detail._id
          ? { ...item, image: detail.image, imageUrl: detail.imageUrl, availableEverywhere: detail.availableEverywhere }
          : item
      ))
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  const detailImageUrl = getImageUrl(detail?.image, detail?.imageUrl)

  // Luxurious form card style
  const formCardStyle: React.CSSProperties = {
    background: 'var(--card-bg-color)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.03)',
    border: '1px solid var(--card-border-color)',
  }

  // Get short location name
  const getShortLocationName = (name: string) => name.replace(/^The Catch\s*[—–-]\s*/i, '')

  // Selected location name for display
  const selectedLocationName = locationFilter
    ? getShortLocationName(locations.find(l => l._id === locationFilter)?.name || '')
    : 'All Locations'

  // Compact pill button class name
  const pillClassName = (selected: boolean) =>
    `mm-pill ${selected ? 'mm-pill--selected' : ''}`

  // Category rectangle class name
  const categoryClassName = (selected: boolean) =>
    `mm-category ${selected ? 'mm-category--selected' : ''}`

  return (
    <Box
      padding={4}
      style={{
        height: '100%',
        overflow: 'hidden',
        background: 'var(--card-bg-color)',
      }}
    >
      {/* CSS for filter buttons with hover states */}
      <style>{`
        .mm-pill {
          padding: 6px 12px;
          border-radius: 16px;
          border: none;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          background: rgba(0,0,0,0.05);
          color: var(--card-fg-color);
        }
        .mm-pill:hover {
          background: rgba(0,0,0,0.1);
        }
        .mm-pill--selected {
          background: var(--card-focus-ring-color);
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .mm-pill--selected:hover {
          background: var(--card-focus-ring-color);
        }
        .mm-category {
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid var(--card-border-color);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          color: var(--card-muted-fg-color);
          text-align: left;
          width: 100%;
        }
        .mm-category:hover {
          background: rgba(0,0,0,0.03);
          border-color: var(--card-muted-fg-color);
        }
        .mm-category--selected {
          border: 2px solid var(--card-focus-ring-color);
          background: var(--card-bg-color);
          color: var(--card-focus-ring-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .mm-category--selected:hover {
          background: var(--card-bg-color);
        }
      `}</style>
      <Flex style={{ height: '100%', gap: 16 }}>
        {/* LEFT PANEL - Filters (1/4 width) */}
        <Card
          shadow={1}
          radius={3}
          style={{
            width: '25%',
            minWidth: 240,
            maxWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box padding={4} style={{ borderBottom: '1px solid var(--card-border-color)' }}>
            <Flex align="center" gap={2}>
              <Utensils size={20} style={{ color: 'var(--card-focus-ring-color)' }} />
              <Heading size={1}>Menu Manager</Heading>
            </Flex>
          </Box>

          {/* Filters Content */}
          <Box style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <Stack space={5}>
              {/* Location Pills */}
              <Stack space={3}>
                <Text size={0} weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                  Location
                </Text>
                <Flex gap={2} wrap="wrap">
                  <button
                    className={pillClassName(locationFilter === '')}
                    onClick={() => setLocationFilter('')}
                  >
                    All
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc._id}
                      className={pillClassName(locationFilter === loc._id)}
                      onClick={() => setLocationFilter(loc._id)}
                    >
                      {getShortLocationName(loc.name)}
                    </button>
                  ))}
                </Flex>
              </Stack>

              {/* Separator */}
              <Box style={{ height: 1, background: 'var(--card-border-color)' }} />

              {/* Category Rectangles */}
              <Stack space={3}>
                <Text size={0} weight="semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                  Category
                </Text>
                <Stack space={2}>
                  <button
                    className={categoryClassName(categoryFilter === '')}
                    onClick={() => setCategoryFilter('')}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      className={categoryClassName(categoryFilter === cat.slug?.current)}
                      onClick={() => setCategoryFilter(cat.slug?.current || '')}
                    >
                      {cat.title}
                    </button>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Card>

        {/* MIDDLE PANEL - Menu Items List (1/4 width) */}
        <Card
          shadow={1}
          radius={3}
          style={{
            width: '25%',
            minWidth: 280,
            maxWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header with Search */}
          <Box padding={3} style={{ borderBottom: '1px solid var(--card-border-color)' }}>
            <Stack space={3}>
              {/* Search Bar */}
              <Box style={{ position: 'relative' }}>
                <TextInput
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  placeholder="Search menu items..."
                  fontSize={1}
                  padding={3}
                  style={{ paddingLeft: 40 }}
                />
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0.4,
                    pointerEvents: 'none',
                  }}
                />
              </Box>

              {/* Context info */}
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={2}>
                  <MapPin size={14} style={{ opacity: 0.5 }} />
                  <Text size={1} muted>{selectedLocationName}</Text>
                </Flex>
                <Text size={0} muted>
                  {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                </Text>
              </Flex>

              {/* "Items not listed" toggle - only show when a location is selected */}
              {locationFilter && (
                <Flex
                  align="center"
                  justify="space-between"
                  padding={2}
                  style={{
                    background: showUnlisted
                      ? 'color-mix(in srgb, var(--card-bg-color) 90%, var(--card-badge-caution-bg-color))'
                      : 'var(--card-skeleton-color-from)',
                    borderRadius: 8,
                    border: showUnlisted ? '1px solid var(--card-badge-caution-bg-color)' : '1px solid transparent',
                  }}
                >
                  <Flex align="center" gap={2}>
                    <AlertCircle size={14} style={{ opacity: 0.6 }} />
                    <Text size={1} weight={showUnlisted ? 'medium' : 'regular'}>
                      {showUnlisted ? 'Showing items NOT listed' : 'Items not listed'}
                    </Text>
                  </Flex>
                  <IOSToggle
                    checked={showUnlisted}
                    onChange={setShowUnlisted}
                    size="small"
                  />
                </Flex>
              )}
            </Stack>
          </Box>

          {/* Item List */}
          <Box style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {loading ? (
              <Flex align="center" justify="center" padding={6}>
                <Spinner muted />
              </Flex>
            ) : error ? (
              <Card tone="critical" padding={4} radius={2}>
                <Text size={1}>{error}</Text>
              </Card>
            ) : (
              <Stack space={2}>
                {filtered.map((item) => (
                  <ListItem
                    key={item._id}
                    item={item}
                    selected={item._id === selectedId}
                    onSelect={() => setSelectedId(item._id)}
                    imageUrl={getImageUrl(item.image, item.imageUrl)}
                  />
                ))}
                {filtered.length === 0 && (
                  <Box padding={4} style={{ textAlign: 'center' }}>
                    <Text size={1} muted>No items found</Text>
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        </Card>

        {/* Right Panel - Detail Editor */}
        <Card
          flex={1}
          shadow={1}
          radius={3}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {detailError ? (
            <Flex align="center" justify="center" height="fill" padding={6}>
              <Card tone="critical" padding={4} radius={2}>
                <Text size={1}>{detailError}</Text>
              </Card>
            </Flex>
          ) : detailLoading || !detail ? (
            <Flex align="center" justify="center" height="fill">
              <Spinner muted />
            </Flex>
          ) : (
            <>
              {/* Header */}
              <Box padding={4} style={{ borderBottom: '1px solid var(--card-border-color)' }}>
                <Flex gap={4} align="center">
                  {/* Item Image */}
                  <Box style={{
                    width: 72,
                    height: 72,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--card-skeleton-color-from)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    {detailImageUrl ? (
                      <img
                        src={detailImageUrl}
                        alt={detail.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Flex align="center" justify="center" style={{ width: '100%', height: '100%' }}>
                        <ImageIcon size={28} style={{ opacity: 0.25 }} />
                      </Flex>
                    )}
                  </Box>

                  <Stack space={2} style={{ flex: 1 }}>
                    <Heading size={2}>
                      {detail.name || 'Untitled'}
                    </Heading>
                    <Flex align="center" gap={2} wrap="wrap">
                      {detail.category && (
                        <Badge tone="primary" fontSize={1}>
                          {categories.find(c => c._id === detail.category?._ref)?.title || 'Uncategorized'}
                        </Badge>
                      )}
                      {detail.basePrice != null && (
                        <Badge tone="positive" fontSize={1}>
                          ${detail.basePrice.toFixed(2)}
                        </Badge>
                      )}
                      {detail.source && (
                        <Badge tone="caution" fontSize={1}>
                          {detail.source}
                        </Badge>
                      )}
                    </Flex>
                  </Stack>

                  {/* Actions */}
                  <Flex gap={2} align="center" style={{ flexShrink: 0 }}>
                    <SaveStatus saving={saving} saved={saved} error={saveError || undefined} />

                    {/* Apply Formatting Rules Button */}
                    <Tooltip
                      content={
                        <Box padding={2} style={{ maxWidth: 240 }}>
                          <Text size={1}>Apply standardized formatting rules to name and description (capitalizations, quantities, etc.)</Text>
                        </Box>
                      }
                      placement="bottom"
                      portal
                    >
                      <Button
                        mode="ghost"
                        tone="default"
                        onClick={() => {
                          if (!detail) return
                          const newName = detail.name ? formatMenuItemName(detail.name) : detail.name
                          const newDesc = detail.description ? formatMenuItemDescription(detail.description) : detail.description
                          const hasChanges = newName !== detail.name || newDesc !== detail.description
                          if (hasChanges) {
                            setDetail(d => d ? { ...d, name: newName, description: newDesc } : d)
                            setSaved(false)
                          }
                        }}
                        icon={Wand2}
                        text="Format"
                        fontSize={1}
                        padding={3}
                      />
                    </Tooltip>

                    <Button
                      tone="primary"
                      onClick={save}
                      disabled={saving}
                      icon={Save}
                      text="Save"
                      fontSize={1}
                      padding={3}
                    />
                  </Flex>
                </Flex>
              </Box>

              {/* Tabs */}
              <Box padding={4} paddingBottom={0}>
                {/* Tab toggle with luxurious styling */}
                <Box style={{
                  display: 'inline-flex',
                  gap: 8,
                  background: 'var(--card-skeleton-color-from)',
                  padding: 6,
                  borderRadius: 10,
                  border: '1px solid var(--card-border-color)',
                }}>
                  <Tab
                    id="basics-tab"
                    aria-controls="basics"
                    icon={FileText}
                    label="Basics"
                    selected={tab === 0}
                    onClick={() => setTab(0)}
                    fontSize={1}
                    padding={3}
                    style={{
                      borderRadius: 6,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <Tab
                    id="location-tab"
                    aria-controls="location"
                    icon={MapPin}
                    label="Pricing & Availability"
                    selected={tab === 1}
                    onClick={() => setTab(1)}
                    fontSize={1}
                    padding={3}
                    style={{
                      borderRadius: 6,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <Tab
                    id="advanced-tab"
                    aria-controls="advanced"
                    icon={Settings}
                    label="Advanced"
                    selected={tab === 2}
                    onClick={() => setTab(2)}
                    fontSize={1}
                    padding={3}
                    style={{
                      borderRadius: 6,
                      transition: 'all 0.2s ease',
                    }}
                  />
                </Box>
              </Box>

              {/* Tab Content */}
              <Box style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {/* Basics Tab - Luxurious single column form */}
                <TabPanel id="basics" aria-labelledby="basics-tab" hidden={tab !== 0}>
                  <Box style={{ maxWidth: '33%', minWidth: 320 }}>
                    <Box style={formCardStyle}>
                      <Stack space={5}>
                        {/* Menu Item Title */}
                        <Stack space={3}>
                          <FieldLabel
                            label="Menu Item Title"
                            tooltip="The display name shown to customers on the menu"
                          />
                          <TextInput
                            value={detail.name || ''}
                            onChange={(e) => setDetail((d) => (d ? { ...d, name: e.currentTarget.value } : d))}
                            placeholder="Enter item name"
                            fontSize={2}
                            padding={3}
                            style={{ fontWeight: 500 }}
                          />
                        </Stack>

                        {/* Description */}
                        <Stack space={3}>
                          <FieldLabel
                            label="Description"
                            tooltip="Brief description shown to customers (keep it appetizing!)"
                          />
                          <TextArea
                            value={detail.description || ''}
                            onChange={(e) => setDetail((d) => (d ? { ...d, description: e.currentTarget.value } : d))}
                            placeholder="A delicious description of this menu item..."
                            rows={3}
                            fontSize={1}
                            padding={3}
                          />
                        </Stack>

                        {/* Category */}
                        <Stack space={3}>
                          <FieldLabel
                            label="Category"
                            tooltip="Menu section where this item appears"
                          />
                          <Select
                            value={detail.category?._ref || ''}
                            onChange={(e) => {
                              const nextVal = e.currentTarget?.value ?? ''
                              setDetail((d) =>
                                d ? { ...d, category: nextVal ? { _type: 'reference', _ref: nextVal } : undefined } : d
                              )
                            }}
                            fontSize={1}
                            padding={3}
                          >
                            <option value="">Select category</option>
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat._id}>{cat.title}</option>
                            ))}
                          </Select>
                        </Stack>

                        {/* Base Price */}
                        <Stack space={3}>
                          <FieldLabel
                            label="Base Price"
                            tooltip="Default price when no location-specific price is set"
                          />
                          <Box style={{ position: 'relative', maxWidth: 120 }}>
                            <TextInput
                              type="number"
                              step="0.01"
                              value={detail.basePrice ?? ''}
                              onChange={(e) => {
                                const val = e.currentTarget.value
                                const nextPrice = val === '' ? undefined : parseFloat(val)
                                if (nextPrice !== undefined && Number.isNaN(nextPrice)) return
                                setDetail((d) => (d ? { ...d, basePrice: nextPrice } : d))
                              }}
                              placeholder="0.00"
                              fontSize={1}
                              padding={3}
                              style={{ paddingLeft: 28, fontFamily: 'monospace' }}
                            />
                            <DollarSign
                              size={14}
                              style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0.5,
                                pointerEvents: 'none',
                              }}
                            />
                          </Box>
                        </Stack>

                        {/* Slug */}
                        <Stack space={3}>
                          <FieldLabel
                            label="Slug"
                            tooltip="URL-friendly identifier (auto-generated from name)"
                          />
                          <TextInput
                            value={detail.slug?.current || ''}
                            onChange={(e) =>
                              setDetail((d) => (d ? { ...d, slug: { _type: 'slug', current: e.currentTarget.value } } : d))
                            }
                            placeholder="item-name-slug"
                            fontSize={1}
                            padding={3}
                            style={{ fontFamily: 'monospace' }}
                          />
                        </Stack>
                      </Stack>
                    </Box>

                    {/* Image Upload Section */}
                    <Box style={{ ...formCardStyle, marginTop: 20 }}>
                      <Stack space={4}>
                        <FieldLabel
                          label="Item Image"
                          tooltip="Photo displayed on the menu and in the cart"
                        />

                        {detailImageUrl ? (
                          <Flex gap={4} align="flex-start">
                            <Box style={{
                              width: 120,
                              height: 120,
                              borderRadius: 10,
                              overflow: 'hidden',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}>
                              <img
                                src={detailImageUrl}
                                alt={detail.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                            <Stack space={3}>
                              <Text size={1} muted>Current image</Text>
                              <Flex gap={2}>
                                <Button
                                  mode="ghost"
                                  tone="primary"
                                  fontSize={1}
                                  padding={2}
                                  icon={Upload}
                                  text="Replace"
                                  disabled={uploading}
                                  onClick={() => fileInputRef.current?.click()}
                                />
                                <Button
                                  mode="ghost"
                                  tone="critical"
                                  fontSize={1}
                                  padding={2}
                                  icon={X}
                                  text="Remove"
                                  disabled={uploading}
                                  onClick={handleRemoveImage}
                                />
                              </Flex>
                            </Stack>
                          </Flex>
                        ) : (
                          <Card
                            padding={5}
                            radius={3}
                            style={{
                              border: '2px dashed var(--card-border-color)',
                              background: 'var(--card-skeleton-color-from)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Flex direction="column" align="center" gap={3}>
                              {uploading ? (
                                <>
                                  <Spinner />
                                  <Text size={1} muted>Uploading...</Text>
                                </>
                              ) : (
                                <>
                                  <Upload size={32} style={{ opacity: 0.4 }} />
                                  <Text size={1} muted>Click to upload an image</Text>
                                  <Text size={0} muted>JPG, PNG, or WebP</Text>
                                </>
                              )}
                            </Flex>
                          </Card>
                        )}

                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleImageUpload}
                        />
                      </Stack>
                    </Box>
                  </Box>
                </TabPanel>

                {/* Pricing & Availability Tab - Two column layout: DFW+Houston left, Oklahoma+Other right */}
                <TabPanel id="location" aria-labelledby="location-tab" hidden={tab !== 1}>
                  <Stack space={4}>
                    {/* Available Everywhere Toggle */}
                    <Card padding={3} radius={2} style={{ background: 'var(--card-skeleton-color-from)' }}>
                      <Flex align="center" justify="space-between">
                        <Stack space={2}>
                          <FieldLabel
                            label="Available Everywhere"
                            tooltip="When enabled, this item is available at all locations and cannot be disabled on individual locations. When disabled, availability must be opted-in per location."
                          />
                          <Text size={1} muted>
                            {detail.availableEverywhere
                              ? 'Available at all locations (per-location toggles set prices only)'
                              : 'Opt-in model — must enable per location'}
                          </Text>
                        </Stack>
                        <IOSToggle
                          checked={detail.availableEverywhere === true}
                          onChange={(checked) => {
                            setDetail((d) => (d ? { ...d, availableEverywhere: checked } : d))
                            setSaved(false)
                          }}
                        />
                      </Flex>
                    </Card>

                    <Text size={1} muted>
                      Toggle availability and set custom prices. Base price: <strong style={{ fontFamily: 'monospace' }}>${detail.basePrice?.toFixed(2) || '—'}</strong>
                    </Text>

                    {locationsError ? (
                      <Card tone="critical" padding={4} radius={2}>
                        <Text size={1}>{locationsError}</Text>
                      </Card>
                    ) : locationsLoading ? (
                      <Flex align="center" justify="center" padding={6}>
                        <Spinner muted />
                      </Flex>
                    ) : (
                      <Flex gap={3}>
                        {/* Left column: DFW + Houston */}
                        <Stack space={3} style={{ flex: 1 }}>
                          {groupedLocations.filter(g => g.column === 'left').map((group) => (
                            <Card key={group.title} radius={2} style={{ border: '1px solid var(--card-border-color)', overflow: 'hidden' }}>
                              <Box
                                padding={2}
                                style={{
                                  background: 'var(--card-skeleton-color-from)',
                                  borderBottom: '1px solid var(--card-border-color)',
                                }}
                              >
                                <Flex align="center" justify="space-between">
                                  <Text size={1} weight="semibold">{group.title}</Text>
                                  <Text size={0} muted>{group.items.length}</Text>
                                </Flex>
                              </Box>
                              {group.items.map((loc) => {
                                const current = overrides.find((ov) => ov.location?._ref === loc._id)
                                // Matches lib/utils/menuAvailability.ts OPT-IN MODEL:
                                // - If availableEverywhere: always available (no per-location opt-out)
                                // - Otherwise: must have explicit available: true
                                const isAvailable = detail.availableEverywhere === true
                                  ? true
                                  : current?.available === true
                                return (
                                  <LocationRow
                                    key={loc._id}
                                    location={loc}
                                    available={isAvailable}
                                    hasOverride={typeof current?.price === 'number'}
                                    currentPrice={current?.price}
                                    basePrice={detail.basePrice}
                                    onAvailabilityToggle={(available) => handleAvailabilityToggle(loc._id, available)}
                                    onPriceChange={(value) => handlePriceChange(loc._id, value)}
                                  />
                                )
                              })}
                            </Card>
                          ))}
                        </Stack>

                        {/* Right column: Oklahoma + Other */}
                        <Stack space={3} style={{ flex: 1 }}>
                          {groupedLocations.filter(g => g.column === 'right').map((group) => (
                            <Card key={group.title} radius={2} style={{ border: '1px solid var(--card-border-color)', overflow: 'hidden' }}>
                              <Box
                                padding={2}
                                style={{
                                  background: 'var(--card-skeleton-color-from)',
                                  borderBottom: '1px solid var(--card-border-color)',
                                }}
                              >
                                <Flex align="center" justify="space-between">
                                  <Text size={1} weight="semibold">{group.title}</Text>
                                  <Text size={0} muted>{group.items.length}</Text>
                                </Flex>
                              </Box>
                              {group.items.map((loc) => {
                                const current = overrides.find((ov) => ov.location?._ref === loc._id)
                                // Matches lib/utils/menuAvailability.ts OPT-IN MODEL:
                                // - If availableEverywhere: always available (no per-location opt-out)
                                // - Otherwise: must have explicit available: true
                                const isAvailable = detail.availableEverywhere === true
                                  ? true
                                  : current?.available === true
                                return (
                                  <LocationRow
                                    key={loc._id}
                                    location={loc}
                                    available={isAvailable}
                                    hasOverride={typeof current?.price === 'number'}
                                    currentPrice={current?.price}
                                    basePrice={detail.basePrice}
                                    onAvailabilityToggle={(available) => handleAvailabilityToggle(loc._id, available)}
                                    onPriceChange={(value) => handlePriceChange(loc._id, value)}
                                  />
                                )
                              })}
                            </Card>
                          ))}
                        </Stack>

                        {locations.length === 0 && (
                          <Box padding={4} style={{ textAlign: 'center', width: '100%' }}>
                            <Text size={1} muted>No locations configured</Text>
                          </Box>
                        )}
                      </Flex>
                    )}
                  </Stack>
                </TabPanel>

                {/* Advanced Tab */}
                <TabPanel id="advanced" aria-labelledby="advanced-tab" hidden={tab !== 2}>
                  <Box style={{ maxWidth: '33%', minWidth: 320 }}>
                    <Box style={formCardStyle}>
                      <Stack space={5}>
                        <Text size={1} muted>
                          Technical fields for POS integration and data syncing.
                        </Text>

                        {/* Source */}
                        <Stack space={3}>
                          <FieldLabel
                            label="Source"
                            tooltip="Where this item was imported from"
                          />
                          <Select
                            value={detail.source || ''}
                            onChange={(e) => setDetail((d) => (d ? { ...d, source: e.currentTarget.value } : d))}
                            fontSize={1}
                            padding={3}
                          >
                            <option value="">Select source</option>
                            <option value="revel">Revel POS</option>
                            <option value="dfw">DFW Import</option>
                            <option value="manual">Manual Entry</option>
                          </Select>
                        </Stack>

                        {/* External ID */}
                        <Stack space={3}>
                          <FieldLabel
                            label="External ID"
                            tooltip="Product ID from external system (used for syncing)"
                          />
                          <Box style={{ position: 'relative' }}>
                            <TextInput
                              value={detail.externalId || ''}
                              onChange={(e) => setDetail((d) => (d ? { ...d, externalId: e.currentTarget.value } : d))}
                              placeholder="e.g., PROD-12345"
                              fontSize={1}
                              padding={3}
                              style={{ paddingLeft: 32, fontFamily: 'monospace' }}
                            />
                            <Hash
                              size={14}
                              style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0.5,
                                pointerEvents: 'none',
                              }}
                            />
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>

                    <Box style={{ marginTop: 16 }}>
                      <Card padding={4} radius={3} tone="caution">
                        <Flex align="flex-start" gap={3}>
                          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          <Text size={1}>
                            Changing these fields may affect POS syncing. Only modify if you know what you&apos;re doing.
                          </Text>
                        </Flex>
                      </Card>
                    </Box>
                  </Box>
                </TabPanel>
              </Box>
            </>
          )}
        </Card>
      </Flex>
    </Box>
  )
}
