import type { StructureResolver } from 'sanity/structure'
import {
  Utensils,
  LayoutGrid,
  MapPin,
  ShoppingBag,
  SlidersHorizontal,
  ImageOff,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // ===== MENU SECTION =====
      S.listItem()
        .title('Menu Items')
        .icon(Utensils)
        .child(
          S.list()
            .title('Menu Items')
            .items([
              S.listItem()
                .title('All Items')
                .icon(Utensils)
                .child(
                  S.documentTypeList('menuItem')
                    .title('All Menu Items')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),
              S.listItem()
                .title('By Category')
                .icon(LayoutGrid)
                .child(
                  S.documentTypeList('menuCategory')
                    .title('Categories')
                    .child((categoryId) =>
                      S.documentList()
                        .title('Items')
                        .filter('_type == "menuItem" && category._ref == $categoryId')
                        .params({ categoryId })
                        .defaultOrdering([{ field: 'name', direction: 'asc' }])
                    )
                ),
              S.divider(),
              S.listItem()
                .title('Missing Images')
                .icon(ImageOff)
                .child(
                  S.documentList()
                    .title('Items Without Images')
                    .filter('_type == "menuItem" && !defined(image)')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),
              S.listItem()
                .title('Missing Prices')
                .icon(DollarSign)
                .child(
                  S.documentList()
                    .title('Items Without Base Price')
                    .filter('_type == "menuItem" && !defined(basePrice)')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),
            ])
        ),

      S.listItem()
        .title('Categories')
        .icon(LayoutGrid)
        .child(
          S.documentTypeList('menuCategory')
            .title('Menu Categories')
            .defaultOrdering([{ field: 'position', direction: 'asc' }])
        ),

      S.listItem()
        .title('Modifier Groups')
        .icon(SlidersHorizontal)
        .child(
          S.documentTypeList('modifierGroup')
            .title('Modifier Groups')
            .defaultOrdering([{ field: 'displayOrder', direction: 'asc' }])
        ),

      S.divider(),

      // ===== LOCATIONS SECTION =====
      S.listItem()
        .title('Locations')
        .icon(MapPin)
        .child(
          S.list()
            .title('Locations')
            .items([
              S.listItem()
                .title('All Locations')
                .icon(MapPin)
                .child(
                  S.documentTypeList('location')
                    .title('All Locations')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),
              S.divider(),
              S.listItem()
                .title('By Region')
                .icon(MapPin)
                .child(
                  S.list()
                    .title('Regions')
                    .items([
                      S.listItem()
                        .title('DFW')
                        .child(
                          S.documentList()
                            .title('DFW Locations')
                            .filter('_type == "location" && region == "dfw"')
                        ),
                      S.listItem()
                        .title('Houston')
                        .child(
                          S.documentList()
                            .title('Houston Locations')
                            .filter('_type == "location" && region == "houston"')
                        ),
                      S.listItem()
                        .title('Oklahoma')
                        .child(
                          S.documentList()
                            .title('Oklahoma Locations')
                            .filter('_type == "location" && region == "oklahoma"')
                        ),
                      S.listItem()
                        .title('East Texas')
                        .child(
                          S.documentList()
                            .title('East Texas Locations')
                            .filter('_type == "location" && region == "east-tx"')
                        ),
                      S.listItem()
                        .title('West Texas')
                        .child(
                          S.documentList()
                            .title('West Texas Locations')
                            .filter('_type == "location" && region == "west-tx"')
                        ),
                    ])
                ),
              S.listItem()
                .title('Menu by Location')
                .icon(Utensils)
                .child(
                  S.documentTypeList('location')
                    .title('Select Location')
                    .child((locationId) =>
                      S.documentList()
                        .title('Menu Items')
                        .filter(
                          '_type == "menuItem" && (availableEverywhere == true || count(locationOverrides[location._ref == $locationId && available == true]) > 0)'
                        )
                        .params({ locationId })
                        .defaultOrdering([{ field: 'name', direction: 'asc' }])
                    )
                ),
            ])
        ),

      S.divider(),

      // ===== ORDERS SECTION =====
      S.listItem()
        .title('Orders')
        .icon(ShoppingBag)
        .child(
          S.list()
            .title('Orders')
            .items([
              S.listItem()
                .title('All Orders')
                .icon(ShoppingBag)
                .child(
                  S.documentTypeList('order')
                    .title('All Orders')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.divider(),
              S.listItem()
                .title('Pending')
                .icon(Clock)
                .child(
                  S.documentList()
                    .title('Pending Orders')
                    .filter('_type == "order" && status == "pending"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Confirmed')
                .icon(CheckCircle)
                .child(
                  S.documentList()
                    .title('Confirmed Orders')
                    .filter('_type == "order" && status == "confirmed"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Preparing')
                .icon(Utensils)
                .child(
                  S.documentList()
                    .title('Orders Being Prepared')
                    .filter('_type == "order" && status == "preparing"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Ready')
                .icon(AlertCircle)
                .child(
                  S.documentList()
                    .title('Orders Ready for Pickup')
                    .filter('_type == "order" && status == "ready"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Completed')
                .icon(CheckCircle)
                .child(
                  S.documentList()
                    .title('Completed Orders')
                    .filter('_type == "order" && status == "completed"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.listItem()
                .title('Cancelled')
                .icon(XCircle)
                .child(
                  S.documentList()
                    .title('Cancelled Orders')
                    .filter('_type == "order" && status == "cancelled"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                ),
              S.divider(),
              S.listItem()
                .title('By Location')
                .icon(MapPin)
                .child(
                  S.documentTypeList('location')
                    .title('Select Location')
                    .child((locationId) =>
                      S.documentList()
                        .title('Orders')
                        .filter('_type == "order" && location._ref == $locationId')
                        .params({ locationId })
                        .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
                    )
                ),
            ])
        ),
    ])
