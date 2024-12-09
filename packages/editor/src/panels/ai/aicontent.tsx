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

import Button from '@ir-engine/ui/src/primitives/tailwind/Button'
import TextArea from '@ir-engine/ui/src/primitives/tailwind/TextArea'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const AiContent = () => {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState<string>('')

  return (
    <div className="ai-content grid h-full w-full grid-rows-[1fr_auto] gap-2">
      <TextArea
        className="ai-prompt-input h-full resize-none text-white"
        placeholder={t('editor:ai.promptPlaceHolder')}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="action-buttons mb-1 inline-flex w-full justify-end gap-3">
        <Button className="generate-text">{t('editor:ai.generateButtonText.text')}</Button>
        <Button className="generate-image">{t('editor:ai.generateButtonText.image')}</Button>
        <Button className="generate-audio">{t('editor:ai.generateButtonText.audio')}</Button>
      </div>
    </div>
  )
}
