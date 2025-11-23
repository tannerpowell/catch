import Section from "@/components/section";
import { getBrand } from "@/lib/brand";
import { notFound } from "next/navigation";
import { LocationJsonLd } from "@/components/jsonld";

export default async function LocationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const brand = getBrand();
  const loc = await brand.getLocationBySlug(resolvedParams.slug);
  if (!loc) return notFound();
  return (
    <>
      <LocationJsonLd loc={loc} />
      <Section title={loc.name}>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">{loc.addressLine1}, {loc.city}, {loc.state} {loc.postalCode}</p>
          {loc.phone && <p className="text-sm"><a className="underline" href={`tel:${loc.phone}`}>{loc.phone}</a></p>}
          {loc.hours && (
            <div className="mt-4">
              <h4 className="font-semibold">Hours</h4>
              <ul className="grid grid-cols-2 gap-y-1 text-sm md:grid-cols-3">
                {Object.entries(loc.hours).map(([day, h]) => (
                  <li key={day} className="opacity-80 capitalize">{day}: {h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
