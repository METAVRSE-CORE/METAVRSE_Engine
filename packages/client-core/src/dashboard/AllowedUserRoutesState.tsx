import React from 'react'

import { defineState } from '@ir-engine/hyperflux'

export type UserRouteStateType = {
  name: string
  scope: string | string[]
  redirect?: string
  component: React.LazyExoticComponent<() => JSX.Element>
  access: boolean
  icon: JSX.Element
}

export const AllowedUserRoutesState = defineState({
  name: 'AllowedUserRoutesState',
  initial: {} as Record<string, UserRouteStateType>
})
