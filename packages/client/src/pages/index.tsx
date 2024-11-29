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

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { NotificationService } from '@ir-engine/client-core/src/common/services/NotificationService'

import { PopupMenuState } from '@ir-engine/client-core/src/user/components/UserMenu/PopupMenuService'
import config from '@ir-engine/common/src/config'
import { getState, useMutableState } from '@ir-engine/hyperflux'

import { UserMenus } from '@ir-engine/client-core/src/user/UserUISystem'

import { RouterState } from '@ir-engine/client-core/src/common/services/RouterService'
import UserAuthMenu from '@ir-engine/client-core/src/user/components/UserMenu/menus/UserAuthMenu'
import UserSignInMenu from '@ir-engine/client-core/src/user/components/UserMenu/menus/UserSignInMenu'
import UserSignUpMenu from '@ir-engine/client-core/src/user/components/UserMenu/menus/UserSignUpMenu'
import { useFind } from '@ir-engine/common'
import { clientSettingPath } from '@ir-engine/common/src/schema.type.module'
import './index.scss'

const ROOT_REDIRECT = config.client.rootRedirect

export const HomePage = (): any => {
  const { t } = useTranslation()
  const clientSettingQuery = useFind(clientSettingPath)
  const clientSetting = clientSettingQuery.data[0]
  const popupMenuState = useMutableState(PopupMenuState)
  const popupMenu = getState(PopupMenuState)
  const Panel = popupMenu.openMenu ? popupMenu.menus[popupMenu.openMenu] : null
  const [selectedAuthRoute, setSelectedAuthRoute] = useState<string>('')

  useEffect(() => {
    console.log('Client Setting Query:', clientSettingQuery)
    console.log('Client Setting:', clientSetting)
  }, [clientSetting])

  const routeHome = () => {
    RouterState.navigate('/')
  }
  const handlePopState = () => {
    window.history.pushState({}, '', '/')
    setSelectedAuthRoute('')
  }

  const renderUserMenu = () => {
    switch (selectedAuthRoute) {
      case '':
        return <UserAuthMenu handleClick={setSelectedAuthRoute} />
      case 'signin':
        return <UserSignInMenu handleClick={setSelectedAuthRoute} />
      case 'signup':
        return <UserSignUpMenu />
      default:
        return <UserAuthMenu handleClick={setSelectedAuthRoute} />
    }
  }

  useEffect(() => {
    const error = new URL(window.location.href).searchParams.get('error')
    if (error) NotificationService.dispatchNotify(error, { variant: 'error' })

    // Checking if "back" button is clicked
    window.addEventListener('popstate', handlePopState)

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!popupMenuState.openMenu.value) popupMenuState.openMenu.set(UserMenus.Profile)
  }, [popupMenuState.openMenu, popupMenuState.menus.keys])

  if (ROOT_REDIRECT && ROOT_REDIRECT.length > 0 && ROOT_REDIRECT !== 'false') {
    const redirectParsed = new URL(ROOT_REDIRECT)
    if (redirectParsed.protocol == null) return <Navigate to={ROOT_REDIRECT} />
    else window.location.href = ROOT_REDIRECT
  } else
    return (
      <div className="lander">
        <style>
          {`
            [class*=lander] {
                pointer-events: auto;
            }
          `}
        </style>
        <div className="main-section">
          {/* {popupMenu.openMenu !== UserMenus.Profile && <ProfileMenu isPopover />} */}
          {/* <ProfileMenu isPopover /> */}
          <img src={clientSetting?.appTitle} onClick={routeHome} className="w-1/4" />
          {renderUserMenu()}
        </div>
        <div className="link-container">
          <div className="link-block">
            {clientSetting?.appSocialLinks?.length > 0 &&
              clientSetting?.appSocialLinks.map((social, index) => (
                <a key={index} target="_blank" className="icon" href={social.link}>
                  <img
                    style={{
                      height: 'auto',
                      maxWidth: '100%'
                    }}
                    src={social.icon}
                    alt=""
                  />
                </a>
              ))}
          </div>
          <div className="logo-bottom">
            {clientSetting?.appSubtitle && <span className="white-txt">{clientSetting?.appSubtitle}</span>}
          </div>
        </div>
      </div>
    )
}

export default HomePage
