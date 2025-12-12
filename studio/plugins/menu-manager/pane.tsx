'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Inline,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextInput,
} from '@sanity/ui'
import { LocationOverridesInput } from '../../sanity/components/LocationOverridesInput'

interface MenuItemLite {
  _id: string
  name: string
  categoryTitle?: string
  categorySlug?: string
  basePrice?: number
  source?: string
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
  locationOverrides?: unknown
  source?: string
  externalId?: string
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid var(--card-border-color)',
  cursor: 'pointer',
}

function ListItem({ item, selected, onSelect }: { item: MenuItemLite; selected: boolean; onSelect: () => void }) {
  return (
    <Card
      padding={3}
      radius={3}
      shadow={selected ? 2 : 1}
      tone={selected ? 'primary' : 'transparent'}
      onClick={onSelect}
      style={{ cursor: 'pointer', border: '1px solid var(--card-border-color)' }}
    >
      <Stack space={2}>
        <Text weight="semibold">{item.name}</Text>
        <Inline space={2} wrap>
          {item.categoryTitle && (
            <Text size={1} muted>
              {item.categoryTitle}
            </Text>
          )}
          {item.basePrice != null && (
            <Text size={1} muted>
              ${item.basePrice.toFixed(2)}
            </Text>
          )}
          {item.source && (
            <Text size={1} muted>
              {item.source}
            </Text>
          )}
        </Inline>
      </Stack>
    </Card>
  )
}

export function MenuManagerPane() {
  const client = useClient({ apiVersion: '2023-08-01' })
  const [items, setItems] = useState<MenuItemLite[]>([])
  const [categories, setCategories] = useState<CategoryLite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [tab, setTab] = useState(0)
  const [detail, setDetail] = useState<MenuItemDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [itemsResp, catsResp] = await Promise.all([
        client.fetch(
          `*[_type == "menuItem" && !(_id in path('drafts.**'))]{_id,name,basePrice,source,category->{title,slug}}|order(name asc)`
        ),
        client.fetch(`*[_type == "menuCategory"]|order(position asc){_id,title,slug}`),
      ])
      if (!cancelled) {
        setItems(
          itemsResp.map((i: { _id: string; name: string; basePrice?: number; source?: string; category?: { title?: string; slug?: { current?: string } } }) => ({
            _id: i._id,
            name: i.name,
            basePrice: i.basePrice,
            source: i.source,
            categoryTitle: i.category?.title,
            categorySlug: i.category?.slug?.current,
          }))
        )
        setCategories(catsResp)
        setLoading(false)
        if (itemsResp[0]) setSelectedId(itemsResp[0]._id)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [client])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    async function loadDetail() {
      setDetailLoading(true)
      const doc = await client.fetch<MenuItemDetail>(`*[_id == $id][0]`, { id: selectedId })
      if (!cancelled) {
        setDetail(doc)
        setDetailLoading(false)
      }
    }
    loadDetail()
    return () => {
      cancelled = true
    }
  }, [client, selectedId])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = search ? item.name.toLowerCase().includes(search.toLowerCase()) : true
      const matchesCat = categoryFilter ? item.categorySlug === categoryFilter : true
      return matchesSearch && matchesCat
    })
  }, [items, search, categoryFilter])

  const save = async () => {
    if (!detail?._id) return
    await client
      .patch(detail._id)
      .set({
        name: detail.name,
        slug: detail.slug,
        description: detail.description,
        basePrice: detail.basePrice,
        category: detail.category,
        locationOverrides: detail.locationOverrides,
        source: detail.source,
        externalId: detail.externalId,
      })
      .commit({ autoGenerateArrayKeys: true })
  }

  return (
    <Flex height="fill" style={{ gap: 16 }} padding={4}>
      {/* Filters & list */ }
      <Box style={{ width: 360, minWidth: 300 }}>
        <Stack space={3}>
          <Heading size={1}>Menu Manager</Heading>
          <TextInput value={search} onChange={(e) => setSearch(e.currentTarget.value)} placeholder="Search items" />
          <Inline space={2} wrap>
            <span
              style={{
                ...pillStyle,
                background: categoryFilter === '' ? 'var(--card-bg-color)' : 'transparent',
              }}
              onClick={() => setCategoryFilter('')}
            >
              <Text size={1}>All</Text>
            </span>
            {categories.map((cat) => (
              <span
                key={cat._id}
                style={{
                  ...pillStyle,
                  background: categoryFilter === cat.slug?.current ? 'var(--card-bg-color)' : 'transparent',
                }}
                onClick={() => setCategoryFilter(cat.slug?.current || '')}
              >
                <Text size={1}>{cat.title}</Text>
              </span>
            ))}
          </Inline>
          {loading ? (
            <Flex align="center" justify="center" padding={4}>
              <Spinner muted />
            </Flex>
          ) : (
            <Card radius={3} border style={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
          <Stack space={2} padding={2}>
            {filtered.map((item) => (
              <ListItem key={item._id} item={item} selected={item._id === selectedId} onSelect={() => setSelectedId(item._id)} />
            ))}
          </Stack>
        </Card>
      )}
        </Stack>
      </Box>

      {/* Detail pane */ }
      <Card flex={1} padding={4} radius={3} border shadow={1}>
        {detailLoading || !detail ? (
          <Flex align="center" justify="center" height="fill">
            <Spinner muted />
          </Flex>
        ) : (
          <Stack space={4}>
            <Heading size={2}>{detail.name || 'Untitled'}</Heading>
            <TabList space={2} onChange={(index) => setTab(index)}>
              <Tab aria-controls="basics">Basics</Tab>
              <Tab aria-controls="location">Location Pricing</Tab>
              <Tab aria-controls="advanced">Advanced</Tab>
            </TabList>
            <TabPanel id="basics" hidden={tab !== 0}>
              <Stack space={3}>
                <TextInput
                value={detail.name || ''}
                onChange={(e) => setDetail((d) => (d ? { ...d, name: e.currentTarget.value } : d))}
                placeholder="Name"
              />
              <TextInput
                value={detail.slug?.current || ''}
                onChange={(e) =>
                    setDetail((d) => (d ? { ...d, slug: { _type: 'slug', current: e.currentTarget.value } } : d))
                }
                placeholder="Slug"
              />
              <Select
                value={detail.category?._ref || ''}
                onChange={(e) =>
                    setDetail((d) =>
                      d
                        ? {
                            ...d,
                            category: e.currentTarget.value ? { _type: 'reference', _ref: e.currentTarget.value } : undefined,
                          }
                        : d
                    )
                  }
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </Select>
                <TextInput
                  value={detail.description || ''}
                  onChange={(e) => setDetail((d) => (d ? { ...d, description: e.currentTarget.value } : d))}
                  placeholder="Description"
                />
                <TextInput
                  type="number"
                  step="0.01"
                  value={detail.basePrice ?? ''}
                  onChange={(e) => setDetail((d) => (d ? { ...d, basePrice: parseFloat(e.currentTarget.value) } : d))}
                  placeholder="Base price"
                />
              </Stack>
            </TabPanel>
            <TabPanel id="location" hidden={tab !== 1}>
              <LocationOverridesInput
                value={detail.locationOverrides}
                onChange={(patchEvent) => {
                  // Apply Sanity PatchEvent to local state
                  const patched = patchEvent.patches.reduce((acc, p) => {
                    if (p.type === 'set') return p.value
                    if (p.type === 'unset') return undefined
                    return acc
                  }, detail.locationOverrides)
                  setDetail((d) => (d ? { ...d, locationOverrides: patched } : d))
                }}
              />
            </TabPanel>
            <TabPanel id="advanced" hidden={tab !== 2}>
              <Grid columns={[1, 1, 2]} gap={2}>
                <TextInput
                  value={detail.source || ''}
                  onChange={(e) => setDetail((d) => (d ? { ...d, source: e.currentTarget.value } : d))}
                  placeholder="Source"
                />
                <TextInput
                  value={detail.externalId || ''}
                  onChange={(e) => setDetail((d) => (d ? { ...d, externalId: e.currentTarget.value } : d))}
                  placeholder="External ID"
                />
              </Grid>
            </TabPanel>
            <Flex gap={2}>
              <Button text="Save" mode="default" onClick={save} />
              <Button
                text="Publish"
                tone="primary"
                mode="default"
                onClick={async () => {
                  await save()
                  await client.mutate([{ publish: { id: detail._id } }]) // publish existing draft/published
                }}
              />
            </Flex>
          </Stack>
        )}
      </Card>
    </Flex>
  )
}
