import { PanelDragContainer, PanelTitle } from '@ir-engine/ui/src/components/editor/layout/Panel'
import { TabData } from 'rc-dock'
import React from 'react'
import { useTranslation } from 'react-i18next'

const AiPanelTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <PanelDragContainer dataTestId="assets-panel-tab">
        <PanelTitle>
          <span>{t('editor:tabs.ai')}</span>
        </PanelTitle>
      </PanelDragContainer>
    </div>
  )
}

export const AiPanelTab: TabData = {
  id: 'aiPanel',
  closable: true,
  title: <AiPanelTitle />,
  content: <div></div>
}
