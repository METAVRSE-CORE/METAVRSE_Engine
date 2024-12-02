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

import { validateEmail } from '@ir-engine/common/src/config'
import multiLogger from '@ir-engine/common/src/logger'
import { useHookstate } from '@ir-engine/hyperflux'
import React from 'react'
import { initialAuthState } from '../../../../common/initialAuthState'
import { clientContextParams } from '../../../../util/ClientContextState'
import { AuthService } from '../../../services/AuthService'

interface UserSignInMenuProps {
  handleClick: (selectedAuthRoute: string) => void
}

const logger = multiLogger.child({ component: 'engine:ecs:ProfileMenu', modifier: clientContextParams })

const UserSignInMenu = ({ handleClick }: UserSignInMenuProps) => {
  const error = useHookstate(false)
  const userEmail = useHookstate('')
  const authState = useHookstate(initialAuthState)

  const handleInputChange = (e) => userEmail.set(e.target.value)

  const validate = () => {
    if (userEmail.value === '') return false
    if (validateEmail(userEmail.value.trim()) && authState?.value?.emailMagicLink) {
      error.set(false)
      return true
    } else {
      error.set(true)
      return false
    }
  }

  const handleLogin = (e: any): any => {
    e.preventDefault()
    if (!validate()) return
    // Get the url without query parameters.
    const redirectUrl = `https://localhost:3000/dashboard`
    AuthService.createMagicLink(userEmail.value, authState?.value, 'email', redirectUrl).then(() =>
      logger.info({
        event_name: 'connect_email',
        event_value: e.currentTarget.id
      })
    )

    return
  }

  const redirectToSignUp = () => {
    window.history.pushState({}, '', '/signup')
    handleClick('signup')
  }

  return (
    <div className="userAuthContainer">
      <article className="w-full">
        <h2 className="title">{'Welcome Back!'}</h2>
        <p className="subTitle">
          {`Don't have an account yet?`}{' '}
          <a onClick={redirectToSignUp} className="link">
            {'Sign up now'}
          </a>
        </p>
      </article>

      <div className="flex w-full flex-col gap-5">
        <div>
          <label id="email">Email Address</label>
          <input
            type="text"
            name={'email'}
            onBlur={validate}
            onChange={handleInputChange}
            id="email"
            placeholder={'Enter your email'}
          />
        </div>

        <button className="button w-full rounded-md" onClick={handleLogin}>
          {'Send magic link'}
        </button>
      </div>
    </div>
  )
}

export default UserSignInMenu
