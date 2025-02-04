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

import { t } from 'i18next'

import { ITableHeadCell } from '../Table'

type IdType =
  | 'select'
  | 'id'
  | 'name'
  | 'accountIdentifier'
  | 'lastLogin'
  | 'ageVerified'
  | 'isGuest'
  | 'action'
  | 'avatar'

export type UserRowType = Record<IdType, string | JSX.Element | undefined>

interface IUserColumn extends ITableHeadCell {
  id: IdType
}

export const userColumns: IUserColumn[] = [
  { id: 'id', label: t('admin:components.user.columns.id') },
  { id: 'name', sortable: true, label: t('admin:components.user.columns.name') },
  { id: 'avatar', label: t('admin:components.user.columns.avatar') },
  { id: 'accountIdentifier', label: t('admin:components.user.columns.accountIdentifier') },
  { id: 'lastLogin', label: t('admin:components.user.columns.lastLogin') },
  { id: 'ageVerified', sortable: true, label: t('admin:components.user.columns.ageVerified') },
  { id: 'isGuest', sortable: true, label: t('admin:components.user.columns.isGuest') },
  { id: 'action', label: t('admin:components.user.columns.action') }
]
