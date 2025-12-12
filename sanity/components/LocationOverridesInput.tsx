import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Inline,
  Spinner,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@sanity/ui";
import type { ArrayOfObjectsInputProps } from "sanity";
import { PatchEvent, set, unset, useClient, useFormValue } from "sanity";

interface LocationDoc {
  _id: string;
  name: string;
  slug?: { current?: string };
}

interface LocationOverride {
  _key: string;
  location: { _type: "reference"; _ref: string };
  price?: number;
  available?: boolean;
}

function createKey() {
  return Math.random().toString(36).slice(2, 10);
}

const badgeTone = (enabled: boolean) => (enabled ? "positive" : "caution");

export function LocationOverridesInput(props: ArrayOfObjectsInputProps) {
  const { value, onChange } = props;
  const client = useClient({ apiVersion: "2023-08-01" });
  const [locations, setLocations] = useState<LocationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const basePrice = useFormValue(["basePrice"]) as number | undefined;

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<LocationDoc[]>(`*[_type == "location"]|order(name asc){_id,name,slug}`)
      .then((locs) => {
        if (!cancelled) {
          setLocations(locs || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const overrides = useMemo(() => (Array.isArray(value) ? (value as LocationOverride[]) : []), [value]);

  const upsertOverride = (locationId: string, updater: (current?: LocationOverride) => LocationOverride | null) => {
    const current = overrides.find((ov) => ov.location?._ref === locationId);
    const next = updater(current);
    const remaining = overrides.filter((ov) => ov.location?._ref !== locationId);
    const nextArray = next ? [...remaining, next] : remaining;
    onChange(PatchEvent.from(nextArray.length ? set(nextArray) : unset()));
  };

  const handleToggle = (locationId: string, enabled: boolean) => {
    if (!enabled) {
      upsertOverride(locationId, () => null);
      return;
    }
    upsertOverride(locationId, (current) => ({
      _key: current?._key || createKey(),
      location: { _type: "reference", _ref: locationId },
      available: true,
      price: current?.price ?? basePrice ?? 0,
    }));
  };

  const handlePriceChange = (locationId: string, nextPrice: number | null) => {
    if (nextPrice == null || Number.isNaN(nextPrice)) return;
    upsertOverride(locationId, (current) => ({
      _key: current?._key || createKey(),
      location: { _type: "reference", _ref: locationId },
      available: current?.available ?? true,
      price: nextPrice,
    }));
  };

  const grouped = useMemo(() => {
    const dfwSlugs = new Set(["denton", "coit-campbell", "garland"]);
    const dfw: LocationDoc[] = [];
    const houston: LocationDoc[] = [];
    const other: LocationDoc[] = [];
    for (const loc of locations) {
      const slug = loc.slug?.current;
      if (slug && dfwSlugs.has(slug)) {
        dfw.push(loc);
      } else if (slug) {
        houston.push(loc);
      } else {
        other.push(loc);
      }
    }
    return [
      { title: "Dallas–Fort Worth", items: dfw },
      { title: "Houston Area", items: houston },
      { title: "Other", items: other },
    ].filter((g) => g.items.length > 0);
  }, [locations]);

  const renderRow = (loc: LocationDoc) => {
    const current = overrides.find((ov) => ov.location?._ref === loc._id);
    const enabled = Boolean(current);
    return (
      <Card
        key={loc._id}
        padding={3}
        radius={3}
        shadow={1}
        tone="transparent"
        style={{
          border: "1px solid var(--card-border-color)",
          background: enabled ? "color-mix(in srgb, var(--card-bg-color), 8% #0ea5e9)" : "var(--card-bg-color)",
        }}
      >
        <Stack space={3}>
          <Flex align="center" justify="space-between" style={{ flexWrap: "wrap" }}>
            <Box>
              <Text weight="semibold">{loc.name}</Text>
              {loc.slug?.current && (
                <Text size={1} muted>
                  {loc.slug.current}
                </Text>
              )}
            </Box>
            <Inline space={2} style={{ alignItems: "center" }}>
              <Badge tone={badgeTone(enabled)}>{enabled ? "Visible" : "Hidden"}</Badge>
              <Switch
                id={`loc-${loc._id}`}
                checked={enabled}
                onChange={(e) => handleToggle(loc._id, e.currentTarget.checked)}
              />
            </Inline>
          </Flex>
          <Stack space={1}>
            <Text size={1} muted>
              Price {basePrice != null ? `(base ${basePrice})` : "(uses base price)"}
            </Text>
            <TextInput
              type="number"
              step="0.01"
              value={enabled && typeof current?.price === "number" ? String(current.price) : ""}
              placeholder={basePrice != null ? String(basePrice) : "Base price"}
              disabled={!enabled}
              onChange={(e) => handlePriceChange(loc._id, parseFloat(e.currentTarget.value))}
            />
          </Stack>
        </Stack>
      </Card>
    );
  };

  return (
    <Stack space={4}>
      <Heading size={1}>Per-location</Heading>
      <Text size={1} muted>
        Toggle locations on/off and set custom prices. When off, the item is hidden there. Blank prices fall back to the base price.
      </Text>
      <Card padding={3} radius={3} shadow={1} tone="transparent" border>
        {loading ? (
          <Flex align="center" justify="center" padding={4}>
            <Spinner muted />
          </Flex>
        ) : (
          <Stack space={3}>
            {grouped.map((group) => (
              <Stack key={group.title} space={2}>
                <Text weight="semibold">{group.title}</Text>
                <Grid columns={[1, 1, 2]} gap={3}>
                  {group.items.map(renderRow)}
                </Grid>
              </Stack>
            ))}
            {locations.length === 0 && (
              <Text size={1} muted>
                No locations found.
              </Text>
            )}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
