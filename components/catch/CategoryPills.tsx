'use client';

interface Category {
  slug: string;
  title: string;
}

interface CategoryPillsProps {
  categories: Category[];
  activeSlug: string;
}

export default function CategoryPills({ categories, activeSlug }: CategoryPillsProps) {
  // Split categories into two groups at "Family Packs"
  const familyPacksIndex = categories.findIndex(cat => cat.slug === 'family-packs');
  const firstGroup = familyPacksIndex >= 0 ? categories.slice(0, familyPacksIndex + 1) : categories;
  const secondGroup = familyPacksIndex >= 0 ? categories.slice(familyPacksIndex + 1) : [];

  return (
    <div className="catch-category-row">
      <div className="catch-category-pills">
        {firstGroup.map(cat => (
          <a
            key={cat.slug}
            href={`#${cat.slug}`}
            className={`catch-category-pill ${activeSlug === cat.slug ? 'active' : ''}`}
          >
            {cat.title}
          </a>
        ))}
        {secondGroup.length > 0 && <div style={{ flexBasis: '100%', height: 0 }} />}
        {secondGroup.map(cat => (
          <a
            key={cat.slug}
            href={`#${cat.slug}`}
            className={`catch-category-pill ${activeSlug === cat.slug ? 'active' : ''}`}
          >
            {cat.title}
          </a>
        ))}
      </div>
    </div>
  );
}
