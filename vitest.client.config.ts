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

import { configDefaults, defineConfig } from 'vitest/config'

const reporters = !process.env.CI ? ['basic'] : configDefaults.reporters // Use default report config on CI.
const watermark = [80, 95] as [number, number]
const threshold = 80

import appRootPath from 'app-root-path'
import path from 'path'

export default defineConfig({
  test: {
    setupFiles: [path.resolve(appRootPath.path, 'packages/spatial/tests/util/patchNode.ts')],
    environment: 'jsdom',
    passWithNoTests: true,
    testTimeout: 2 * 60 * 1000,
    hookTimeout: 2 * 60 * 1000,
    reporters: reporters,
    slowTestThreshold: 1000,
    coverage: {
      reporter: ['html'],
      provider: 'istanbul',
      thresholds: {
        perFile: true,
        statements: threshold,
        branches: threshold,
        functions: threshold,
        lines: threshold
      },
      watermarks: {
        statements: watermark,
        branches: watermark,
        functions: watermark,
        lines: watermark
      }
    }
  }
})
