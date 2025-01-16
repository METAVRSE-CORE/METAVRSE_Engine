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

import { PopoverState } from '@ir-engine/client-core/src/common/services/PopoverState'
import { useMutation } from '@ir-engine/common'
import { fileBrowserPath } from '@ir-engine/common/src/schema.type.module'
import { NO_PROXY, useMutableState } from '@ir-engine/hyperflux'
import { TransformComponent } from '@ir-engine/spatial'
import { DropdownItem } from '@ir-engine/ui'
import { ContextMenu } from '@ir-engine/ui/src/components/tailwind/ContextMenu'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Vector3 } from 'three'
import ImageCompressionPanel from '../../components/assets/ImageCompressionPanel'
import ModelCompressionPanel from '../../components/assets/ModelCompressionPanel'
import { addMediaNode } from '../../functions/addMediaNode'
import { getSpawnPositionAtCenter } from '../../functions/screenSpaceFunctions'
import { FilesState, SelectedFilesState } from '../../services/FilesState'
import { ClickPlacementState } from '../../systems/ClickPlacementSystem'
import { fileConsistsOfContentType, useCurrentFiles } from './helpers'
import DeleteFileModal from './modals/DeleteFileModal'
import FilePropertiesModal from './modals/FilePropertiesModal'
import RenameFileModal from './modals/RenameFileModal'

function PasteFileButton({
  newPath,
  setAnchorEvent
}: {
  newPath?: string
  setAnchorEvent: (event: React.MouseEvent | undefined) => void
}) {
  const { t } = useTranslation()
  const { filesQuery } = useCurrentFiles()
  const isFilesLoading = filesQuery?.status === 'pending'
  const fileService = useMutation(fileBrowserPath)

  const filesState = useMutableState(FilesState)
  const clipboardFiles = filesState.clipboardFiles.files
  const hasClipboardFiles = clipboardFiles.length > 0
  const currentDirectory = filesState.selectedDirectory.value.startsWith('/')
    ? filesState.selectedDirectory.value.substring(1)
    : filesState.selectedDirectory.value

  return (
    <DropdownItem
      data-testid="files-panel-context-menu-paste-asset-button"
      disabled={!hasClipboardFiles}
      onClick={async () => {
        if (!hasClipboardFiles || isFilesLoading) return
        setAnchorEvent(undefined)
        for (const clipboardFile of clipboardFiles.get(NO_PROXY)) {
          // make sure we are not moving a folder into itself
          if (!filesState.clipboardFiles.isCopy.value && (newPath ?? currentDirectory).startsWith(clipboardFile.path))
            return
          await fileService.update(null, {
            oldProject: filesState.projectName.value,
            newProject: filesState.projectName.value,
            oldName: clipboardFile.fullName,
            newName: clipboardFile.fullName,
            oldPath: clipboardFile.path,
            newPath: newPath ?? currentDirectory,
            isCopy: filesState.clipboardFiles.isCopy.value
          })
        }
      }}
      label={t('editor:layout.filebrowser.pasteAsset')}
      className="h-auto bg-[rgba(20,22,25,0.9)] px-6 py-1 text-sm text-white"
    />
  )
}

export function FileContextMenu({
  anchorEvent,
  setAnchorEvent
}: {
  anchorEvent: React.MouseEvent | undefined
  setAnchorEvent: (event: React.MouseEvent | undefined) => void
}) {
  const { t } = useTranslation()
  const { createNewFolder, refreshDirectory } = useCurrentFiles()
  const selectedFiles = useMutableState(SelectedFilesState)
  const filesState = useMutableState(FilesState)

  const hasSelection = selectedFiles.length > 0
  const hasFiles = selectedFiles.some((file) => !file.isFolder.value)

  const fileActions = [
    {
      // CUT
      condition: hasSelection,
      label: t('editor:layout.filebrowser.cutAsset'),
      action: () => {
        filesState.clipboardFiles.set({ files: selectedFiles.get(NO_PROXY) })
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-cut-asset-button'
    },
    {
      // COPY
      condition: hasSelection,
      label: t('editor:layout.filebrowser.copyAsset'),
      action: () => {
        filesState.clipboardFiles.set({ files: selectedFiles.get(NO_PROXY), isCopy: true })
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-copy-asset-button'
    },
    {
      // PASTE
      condition: true, // Paste is always available
      label: '',
      action: () => {},
      testId: '',
      component: <PasteFileButton setAnchorEvent={setAnchorEvent} />
    },
    {}, // BREAK
    {
      condition: selectedFiles.length === 1,
      label: t('editor:layout.filebrowser.renameAsset'),
      action: () => {
        PopoverState.showPopupover(
          <RenameFileModal projectName={filesState.projectName.value} file={selectedFiles.value[0]} />
        )
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-rename-asset-button'
    },
    {
      // DELETE
      condition: hasSelection,
      label: t('editor:layout.assetGrid.deleteAsset'),
      action: () => {
        PopoverState.showPopupover(
          <DeleteFileModal
            files={selectedFiles.get(NO_PROXY)}
            onComplete={(err) => {
              selectedFiles.set([])
              ClickPlacementState.resetSelectedAsset()
            }}
          />
        )
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-delete-asset-button'
    },
    {
      // COMPRESS
      condition: hasFiles && fileConsistsOfContentType(selectedFiles.value, 'model'),
      label: t('editor:layout.filebrowser.compress'),
      action: () => {
        PopoverState.showPopupover(
          <ModelCompressionPanel selectedFiles={selectedFiles.value} refreshDirectory={refreshDirectory} />
        )
        setAnchorEvent(undefined)
      },
      testId: ''
    },
    {
      // COMPRESS IMAGE
      condition: hasFiles && fileConsistsOfContentType(selectedFiles.value, 'image'),
      label: t('editor:layout.filebrowser.compress') + ' Image',
      action: () => {
        PopoverState.showPopupover(
          <ImageCompressionPanel selectedFiles={selectedFiles.value} refreshDirectory={refreshDirectory} />
        )
        setAnchorEvent(undefined)
      },
      testId: ''
    },
    {}, // BREAK
    {
      // COPY
      condition: hasSelection,
      label: t('editor:layout.assetGrid.copyURL'),
      action: () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(selectedFiles.map((file) => file.url.value).join(' '))
        }
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-copy-url-button'
    },
    {
      // OPEN IN NEW TAB
      condition: hasFiles,
      label: t('editor:layout.assetGrid.openInNewTab'),
      action: () => {
        selectedFiles.filter((file) => !file.isFolder.value).forEach((file) => window.open(file.url.value))
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-open-in-new-tab-button'
    },
    {}, // BREAK
    {
      // PLACE OBJECT
      condition: hasFiles,
      label: t('editor:layout.assetGrid.placeObject'),
      action: () => {
        const vec3 = new Vector3()
        getSpawnPositionAtCenter(vec3)
        selectedFiles
          .filter((file) => !file.isFolder.value)
          .map((file) => {
            addMediaNode(file.url.value, undefined, undefined, [
              { name: TransformComponent.jsonID, props: { position: vec3 } }
            ])
          })
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-place-object-button'
    },
    {
      // PLACE OBJECT AT ORIGIN
      condition: hasFiles,
      label: t('editor:layout.assetGrid.placeObjectAtOrigin'),
      action: () => {
        selectedFiles
          .filter((file) => !file.isFolder.value)
          .map((file) => {
            addMediaNode(file.url.value)
          })
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-place-object-at-origin-button'
    },
    {}, // BREAK
    {
      // ADD NEW FOLDER
      condition: true, // Always visible
      label: t('editor:layout.filebrowser.addNewFolder'),
      action: () => {
        createNewFolder()
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-add-new-folder-button'
    },
    {
      // VIEW PROPERTIES
      condition: hasSelection,
      label: t('editor:layout.filebrowser.viewAssetProperties'),
      action: () => {
        PopoverState.showPopupover(<FilePropertiesModal />)
        setAnchorEvent(undefined)
      },
      testId: 'files-panel-file-item-context-menu-view-asset-properties-button'
    }
  ]

  return (
    <ContextMenu anchorEvent={anchorEvent} onClose={() => setAnchorEvent(undefined)}>
      <div className="w-40 overflow-hidden rounded" tabIndex={0}>
        {fileActions
          .filter((action) => action.condition || Object.keys(action).length === 0)
          .map((action, index) => {
            if (action.component) {
              return action.component
            }

            return (
              <>
                {Object.keys(action).length === 0 && <hr className="mx-1 border-[#42454D]" />}
                {Object.keys(action).length > 0 && (
                  <DropdownItem
                    key={index}
                    label={action.label || ''}
                    onClick={action.action}
                    data-testid={action.testId}
                    className="h-auto bg-[rgba(20,22,25,0.9)] px-6 py-1 text-sm text-white"
                  />
                )}
              </>
            )
          })}
      </div>
    </ContextMenu>
  )
}
