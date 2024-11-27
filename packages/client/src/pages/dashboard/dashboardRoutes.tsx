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

import React from 'react'

import { ThemeState } from '@ir-engine/client-core/src/common/services/ThemeService'
import { getMutableState, getState, useHookstate } from '@ir-engine/hyperflux'

import { AuthService, AuthState } from '@ir-engine/client-core/src/user/services/AuthService'

import '@ir-engine/engine/src/EngineModule'

import { useTranslation } from 'react-i18next'
import { HiMiniMoon, HiMiniSun } from 'react-icons/hi2'

import Button from '@ir-engine/ui/src/primitives/tailwind/Button'

import { useFind } from '@ir-engine/common'
import { identityProviderPath } from '@ir-engine/common/src/schema.type.module'
import Tooltip from '@ir-engine/ui/src/primitives/tailwind/Tooltip'

const DashboardTopBar = () => {
  const { t } = useTranslation()
  const theme = useHookstate(getMutableState(ThemeState)).theme
  const identityProvidersQuery = useFind(identityProviderPath)
  const selfUser = getState(AuthState).user
  const tooltip = `${selfUser.name} (${identityProvidersQuery.data
    .map((item) => `${item.type}: ${item.accountIdentifier}`)
    .join(', ')}) ${selfUser.id}`

  const toggleTheme = () => {
    const currentTheme = getState(ThemeState).theme
    ThemeState.setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="flex h-16 w-full items-center justify-between bg-theme-surface-main px-8 py-4">
      <img src="static/ir.svg" alt="iR Engine Logo" className={`h-7 w-7${theme.value === 'light' ? ' invert' : ''}`} />
      <div className="flex gap-4">
        <Button onClick={toggleTheme} className="pointer-events-auto bg-transparent p-0">
          {theme.value === 'light' ? (
            <HiMiniMoon className="text-theme-primary" size="1.5rem" />
          ) : (
            <HiMiniSun className="text-theme-primary" size="1.5rem" />
          )}
        </Button>
        <Tooltip content={tooltip}>
          <Button className="pointer-events-auto" size="small" onClick={() => AuthService.logoutUser()}>
            {t('admin:components.common.logOut')}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

const DashboardRoutes = () => {
  return <DashboardTopBar />
}

export default DashboardRoutes
