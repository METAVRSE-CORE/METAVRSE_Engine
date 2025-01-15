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

import fs from 'fs'
import path from 'path'

import { StorageProviderInterface } from './storageprovider/storageprovider.interface'

export const copyRecursiveSync = function (src: string, dest: string): void {
  if (!fs.existsSync(src)) return

  if (fs.lstatSync(src).isDirectory()) {
    fs.mkdirSync(dest)
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

export const getIncrementalName = async function (
  name: string,
  directoryPath: string,
  store: StorageProviderInterface,
  isDirectory?: boolean
): Promise<string> {
  let filename = name

  if (!(await store.doesExist(filename, directoryPath))) return filename
  if (isDirectory && !(await store.isDirectory(filename, directoryPath))) return filename

  let count = 1

  if (isDirectory) {
    while (await store.isDirectory(filename, directoryPath)) {
      filename = `${name}_${count}`
      count++
    }
  } else {
    const extension = path.extname(name)
    const baseName = path.basename(name, extension)

    while (await store.doesExist(filename, directoryPath)) {
      filename = `${baseName}_${count}${extension}`
      count++
    }
  }

  return filename
}
