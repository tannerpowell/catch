import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import type { ArrayOfObjectsInputProps, FieldProps } from "sanity";
import { PatchEvent, set, unset, useClient, useFormValue } from "sanity";
import { apiVersion } from "../env";

// Custom field wrapper - removes Sanity's default padding/label
export function LocationOverridesField(props: FieldProps) {
  return (
    <div style={{ marginTop: 0, paddingTop: 0 }}>
      {props.children}
    </div>
  );
}

interface LocationDoc {
  _id: string;
  name: string;
  slug?: { current?: string };
  region?: string;
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

// iOS-style toggle - compact version
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        position: "relative",
        display: "inline-block",
        width: 36,
        height: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
      />
      <span
        style={{
          position: "absolute",
          cursor: disabled ? "not-allowed" : "pointer",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? "#34C759" : "rgba(120,120,128,0.32)",
          borderRadius: 20,
          transition: "background-color 0.2s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            height: 16,
            width: 16,
            left: checked ? 18 : 2,
            top: 2,
            backgroundColor: "white",
            borderRadius: "50%",
            transition: "left 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </span>
    </label>
  );
}

// Compact row for a single location
function LocationRow({
  location,
  override,
  basePrice,
  onToggle,
  onPriceChange,
}: {
  location: LocationDoc;
  override?: LocationOverride;
  basePrice?: number;
  onToggle: (enabled: boolean) => void;
  onPriceChange: (price: number | null) => void;
}) {
  const enabled = Boolean(override?.available);
  const shortName = location.name.includes("—")
    ? location.name.split("—")[1].trim()
    : location.name;

  return (
    <Flex
      align="center"
      gap={2}
      paddingY={1}
      paddingX={2}
      style={{
        borderBottom: "1px solid var(--card-border-color)",
        background: enabled ? "rgba(52, 199, 89, 0.08)" : "transparent",
        minHeight: 32,
      }}
    >
      <Toggle checked={enabled} onChange={onToggle} />
      <Text
        size={1}
        weight={enabled ? "medium" : "regular"}
        style={{
          flex: 1,
          minWidth: 0,
          opacity: enabled ? 1 : 0.5,
        }}
      >
        {shortName}
      </Text>
      <Box style={{ width: 56, flexShrink: 0 }}>
        <TextInput
          type="number"
          step="0.01"
          fontSize={1}
          padding={1}
          value={
            enabled && typeof override?.price === "number"
              ? String(override.price)
              : ""
          }
          placeholder={basePrice != null ? String(basePrice) : "—"}
          disabled={!enabled}
          onChange={(e) => {
            const val = e.currentTarget.value;
            onPriceChange(val === "" ? null : parseFloat(val));
          }}
          style={{
            textAlign: "right",
            fontFamily: "monospace",
            fontSize: 12,
            opacity: enabled ? 1 : 0.4,
          }}
        />
      </Box>
    </Flex>
  );
}

export function LocationOverridesInput(props: ArrayOfObjectsInputProps) {
  const { value, onChange } = props;
  const client = useClient({ apiVersion });
  const [locations, setLocations] = useState<LocationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const basePrice = useFormValue(["basePrice"]) as number | undefined;

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<LocationDoc[]>(
        `*[_type == "location"]|order(region asc, name asc){_id,name,slug,region}`
      )
      .then((locs) => {
        if (!cancelled) {
          setLocations(locs || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to fetch locations:", err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const overrides = useMemo(
    () => (Array.isArray(value) ? (value as LocationOverride[]) : []),
    [value]
  );

  const upsertOverride = (
    locationId: string,
    updater: (current?: LocationOverride) => LocationOverride | null
  ) => {
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
    if (nextPrice !== null && Number.isNaN(nextPrice)) return;
    upsertOverride(locationId, (current) => ({
      _key: current?._key || createKey(),
      location: { _type: "reference", _ref: locationId },
      available: current?.available ?? true,
      price: nextPrice ?? undefined,
    }));
  };

  // Group by region
  const grouped = useMemo(() => {
    const regionLabels: Record<string, string> = {
      dfw: "DFW",
      houston: "Houston",
      oklahoma: "Oklahoma",
      "east-tx": "East TX",
      "west-tx": "West TX",
    };

    const groups: { region: string; label: string; items: LocationDoc[] }[] = [];
    const regionMap = new Map<string, LocationDoc[]>();

    for (const loc of locations) {
      const region = loc.region || "other";
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(loc);
    }

    const order = ["dfw", "houston", "oklahoma", "east-tx", "west-tx", "other"];
    for (const region of order) {
      const items = regionMap.get(region);
      if (items && items.length > 0) {
        groups.push({
          region,
          label: regionLabels[region] || "Other",
          items,
        });
      }
    }

    return groups;
  }, [locations]);

  if (loading) {
    return (
      <Flex align="center" justify="center" padding={3} gap={2}>
        <Spinner muted />
        <Text size={1} muted>Loading...</Text>
      </Flex>
    );
  }

  if (locations.length === 0) {
    return (
      <Card padding={2} radius={2} tone="transparent" border>
        <Text size={1} muted>No locations found.</Text>
      </Card>
    );
  }

  return (
    <Flex gap={2}>
      {/* Left column */}
      <Stack space={1} style={{ flex: 1 }}>
          {grouped
            .filter((_, i) => i % 2 === 0)
            .map((group) => (
              <Card
                key={group.region}
                radius={1}
                style={{ border: "1px solid var(--card-border-color)", overflow: "hidden" }}
              >
                <Flex
                  align="center"
                  justify="space-between"
                  paddingX={2}
                  paddingY={1}
                  style={{
                    background: "var(--card-skeleton-color-from)",
                    borderBottom: "1px solid var(--card-border-color)",
                  }}
                >
                  <Text size={0} weight="semibold">{group.label}</Text>
                  <Text size={0} muted>
                    {group.items.filter((l) =>
                      overrides.some((o) => o.location?._ref === l._id && o.available)
                    ).length}/{group.items.length}
                  </Text>
                </Flex>
                {group.items.map((loc) => (
                  <LocationRow
                    key={loc._id}
                    location={loc}
                    override={overrides.find((o) => o.location?._ref === loc._id)}
                    basePrice={basePrice}
                    onToggle={(enabled) => handleToggle(loc._id, enabled)}
                    onPriceChange={(price) => handlePriceChange(loc._id, price)}
                  />
                ))}
              </Card>
            ))}
        </Stack>

      {/* Right column */}
      <Stack space={1} style={{ flex: 1 }}>
        {grouped
          .filter((_, i) => i % 2 === 1)
            .map((group) => (
              <Card
                key={group.region}
                radius={1}
                style={{ border: "1px solid var(--card-border-color)", overflow: "hidden" }}
              >
                <Flex
                  align="center"
                  justify="space-between"
                  paddingX={2}
                  paddingY={1}
                  style={{
                    background: "var(--card-skeleton-color-from)",
                    borderBottom: "1px solid var(--card-border-color)",
                  }}
                >
                  <Text size={0} weight="semibold">{group.label}</Text>
                  <Text size={0} muted>
                    {group.items.filter((l) =>
                      overrides.some((o) => o.location?._ref === l._id && o.available)
                    ).length}/{group.items.length}
                  </Text>
                </Flex>
                {group.items.map((loc) => (
                  <LocationRow
                    key={loc._id}
                    location={loc}
                    override={overrides.find((o) => o.location?._ref === loc._id)}
                    basePrice={basePrice}
                    onToggle={(enabled) => handleToggle(loc._id, enabled)}
                    onPriceChange={(price) => handlePriceChange(loc._id, price)}
                  />
                ))}
              </Card>
            ))}
      </Stack>
    </Flex>
  );
}
