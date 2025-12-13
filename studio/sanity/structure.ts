import type {StructureResolver} from 'sanity/structure'

const menuItemListForLocation = (S: Parameters<StructureResolver>[0], locationId: string) =>
  S.documentTypeList('menuItem')
    .title('Menu Items')
    .filter(
      '!defined(locationOverrides) || count(locationOverrides[location._ref == $locationId]) > 0'
    )
    .params({locationId});

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem().title('All Menu Items').child(S.documentTypeList('menuItem')),
      S.listItem().title('All Categories').child(S.documentTypeList('menuCategory')),
      S.listItem().title('Locations').child(S.documentTypeList('location')),
      S.divider(),
      S.listItem()
        .title('Menu by Location')
        .child(
          S.documentTypeList('location')
            .title('Pick a Location')
            .child((locationId) =>
              S.list()
                .title('Menu')
                .items([
                  S.listItem().title('Menu Items').child(menuItemListForLocation(S, locationId)),
                  S.listItem().title('Categories (shared)').child(S.documentTypeList('menuCategory')),
                  S.listItem()
                    .title('Location Settings')
                    .child(S.document().schemaType('location').documentId(locationId)),
                ])
            )
        ),
    ])
