import {definePlugin} from 'sanity'
import {MenuManagerPane} from './pane'
import {UtensilsCrossed} from 'lucide-react'

export const menuManager = definePlugin({
  name: 'menu-manager',
  tools: [
    {
      name: 'menu-manager',
      title: 'Menu Manager',
      component: MenuManagerPane,
      icon: UtensilsCrossed
    }
  ]
})
