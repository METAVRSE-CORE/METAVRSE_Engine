/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/ir-engine/ir-engine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Infinite Reality Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Infinite Reality Engine team.

All portions of the code written by the Infinite Reality Engine team are Copyright © 2021-2023 
Infinite Reality Engine. All Rights Reserved.
*/

import React, { lazy } from 'react'
import { HiOutlineCube } from 'react-icons/hi'
import { HiChatBubbleOvalLeftEllipsis, HiHome, HiMapPin, HiMiniCamera } from 'react-icons/hi2'
import { UserRouteStateType } from './AllowedUserRoutesState'

const StudioPage = lazy(() => import('../../../client/src/pages/editor'))

const LocationPage = lazy(() => import('../../../client/src/pages/location/location'))

const ChatPage = lazy(() => import('../../../client/src/pages/chat/chat'))

const CapturePage = lazy(() => import('../../../client/src/pages/capture'))

export const DefaultUserRoutes: Record<string, UserRouteStateType> = {
  home: {
    name: 'Home',
    scope: 'editor',
    component: StudioPage,
    access: false,
    icon: <HiHome />
  },
  studio: {
    name: 'Editor',
    scope: 'editor',
    component: StudioPage,
    access: false,
    icon: <HiOutlineCube />
  },
  location: {
    name: 'Locations',
    scope: 'location',
    component: LocationPage,
    access: false,
    icon: <HiMapPin />
  },
  chat: {
    name: 'Chat',
    scope: 'routes',
    component: ChatPage,
    access: false,
    icon: <HiChatBubbleOvalLeftEllipsis />
  },
  capture: {
    name: 'Capture',
    scope: 'routes',
    component: CapturePage,
    access: false,
    icon: <HiMiniCamera />
  }
}
