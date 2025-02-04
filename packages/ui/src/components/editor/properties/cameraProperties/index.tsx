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
import React from 'react'

import { getOptionalComponent, useComponent } from '@ir-engine/ecs/src/ComponentFunctions'
import { CameraSettingsComponent } from '@ir-engine/engine/src/scene/components/CameraSettingsComponent'

import { iterateEntityNode } from '@ir-engine/ecs'
import { defineQuery } from '@ir-engine/ecs/src/QueryFunctions'
import {
  EditorComponentType,
  commitProperties,
  commitProperty,
  updateProperty
} from '@ir-engine/editor/src/components/properties/Util'
import NodeEditor from '@ir-engine/editor/src/panels/properties/common/NodeEditor'
import { GLTFComponent } from '@ir-engine/engine/src/gltf/GLTFComponent'
import { MeshComponent } from '@ir-engine/spatial/src/renderer/components/MeshComponent'
import { HiOutlineCamera } from 'react-icons/hi'
import { Box3, Vector3 } from 'three'
import { Slider } from '../../../../../editor'
import Button from '../../../../primitives/tailwind/Button'
import InputGroup from '../../input/Group'
import NumericInput from '../../input/Numeric'
import SelectInput from '../../input/Select'

/** Types copied from Camera Modes of engine. */
const projectionTypeSelect = [
  {
    label: 'Orthographic',
    value: 0
  },
  {
    label: 'Perspective',
    value: 1
  }
]

const modelQuery = defineQuery([GLTFComponent])
const _box3 = new Box3()

export const CameraPropertiesNodeEditor: EditorComponentType = (props) => {
  const cameraSettings = useComponent(props.entity, CameraSettingsComponent)

  const calculateClippingPlanes = () => {
    const box = new Box3()
    const modelEntities = modelQuery()
    for (const entity of modelEntities) {
      iterateEntityNode(entity, (entity) => {
        const mesh = getOptionalComponent(entity, MeshComponent)
        if (mesh?.geometry?.boundingBox) {
          _box3.copy(mesh.geometry.boundingBox)
          _box3.applyMatrix4(mesh.matrixWorld)
          box.union(_box3)
        }
      })
    }
    const boxSize = box.getSize(new Vector3()).length()
    commitProperties(
      CameraSettingsComponent,
      {
        cameraNearClip: 0.1,
        cameraFarClip: Math.max(boxSize, 100)
      },
      [props.entity]
    )
  }

  return (
    <NodeEditor
      {...props}
      name={t('editor:properties.cameraSettings.name')}
      description={t('editor:properties.cameraSettings.description')}
      Icon={CameraPropertiesNodeEditor.iconComponent}
      entity={props.entity}
    >
      <InputGroup name="Projection type" label={t('editor:properties.cameraSettings.lbl-projectionType')}>
        <SelectInput
          // placeholder={projectionTypeSelect[0].label}
          value={cameraSettings.projectionType.value}
          onChange={commitProperty(CameraSettingsComponent, 'projectionType')}
          options={projectionTypeSelect}
        />
      </InputGroup>
      <InputGroup name="Field of view" label={t('editor:properties.cameraSettings.lbl-fov')}>
        <NumericInput
          onChange={updateProperty(CameraSettingsComponent, 'fov')}
          onRelease={commitProperty(CameraSettingsComponent, 'fov')}
          min={1}
          max={180}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={cameraSettings.fov.value}
        />
      </InputGroup>
      <div className="my-1 flex flex-wrap items-center justify-end">
        <Button className="flex flex-wrap items-center justify-end" onClick={calculateClippingPlanes}>
          {t('editor:properties.cameraSettings.lbl-calcClippingPlanes') as string}
        </Button>
      </div>

      <InputGroup
        name="cameraClippingPlanes"
        label={t('editor:properties.cameraSettings.lbl-clippingPlanes')}
        containerClassName="gap-2"
      >
        <div className="flex w-full flex-col gap-2 border-[0.5px] border-[#42454D] pb-1 pl-4 pr-4 pt-1">
          <InputGroup
            name="Near"
            label={t('editor:properties.cameraSettings.lbl-nearClip')}
            className="w-2/3 flex-grow"
          >
            <div className="flex w-full items-center gap-2">
              <NumericInput
                onChange={updateProperty(CameraSettingsComponent, 'cameraNearClip')}
                onRelease={commitProperty(CameraSettingsComponent, 'cameraNearClip')}
                min={0.001}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={cameraSettings.cameraNearClip.value}
                className="flex w-full flex-grow"
              />
            </div>
          </InputGroup>
          <InputGroup name="Far" label={t('editor:properties.cameraSettings.lbl-farClip')} className="w-2/3 flex-grow">
            <div className="flex w-full items-center gap-2">
              <NumericInput
                onChange={updateProperty(CameraSettingsComponent, 'cameraFarClip')}
                onRelease={commitProperty(CameraSettingsComponent, 'cameraFarClip')}
                min={0.001}
                smallStep={0.001}
                mediumStep={0.01}
                largeStep={0.1}
                value={cameraSettings.cameraFarClip.value}
                className="flex w-full flex-grow"
              />
            </div>
          </InputGroup>
        </div>
      </InputGroup>
      <InputGroup
        name="minCameraDistance"
        label={t('editor:properties.cameraSettings.lbl-cameraDistance')}
        containerClassName="gap-2"
      >
        <div className="flex w-full flex-col gap-2 border-[0.5px] border-[#42454D] pb-1 pl-4 pr-4 pt-1">
          <InputGroup
            name="Min"
            label={t('editor:properties.cameraSettings.lbl-minCamDist')}
            className="w-2/3 flex-grow"
          >
            <NumericInput
              onChange={updateProperty(CameraSettingsComponent, 'minCameraDistance')}
              onRelease={commitProperty(CameraSettingsComponent, 'minCameraDistance')}
              min={0.001}
              smallStep={0.001}
              mediumStep={0.01}
              largeStep={0.1}
              value={cameraSettings.minCameraDistance.value}
              className="flex w-full flex-grow"
            />
          </InputGroup>
          <InputGroup
            name="Max"
            label={t('editor:properties.cameraSettings.lbl-maxCamDist')}
            className="w-2/3 flex-grow"
          >
            <NumericInput
              onChange={updateProperty(CameraSettingsComponent, 'maxCameraDistance')}
              onRelease={commitProperty(CameraSettingsComponent, 'maxCameraDistance')}
              min={0.001}
              smallStep={0.001}
              mediumStep={0.01}
              largeStep={0.1}
              value={cameraSettings.maxCameraDistance.value}
              className="flex w-full flex-grow"
            />
          </InputGroup>
        </div>
      </InputGroup>
      <InputGroup name="startCameraDistance" label={t('editor:properties.cameraSettings.lbl-startCameraDistance')}>
        {/*<NumericInput*/}
        {/*  onChange={updateProperty(CameraSettingsComponent, 'startCameraDistance')}*/}
        {/*  onRelease={commitProperty(CameraSettingsComponent, 'startCameraDistance')}*/}
        {/*  min={0.001}*/}
        {/*  smallStep={0.001}*/}
        {/*  mediumStep={0.01}*/}
        {/*  largeStep={0.1}*/}
        {/*  value={cameraSettings.startCameraDistance.value}*/}
        {/*/>*/}
        <Slider
          min={cameraSettings.minCameraDistance.value}
          max={cameraSettings.maxCameraDistance.value}
          step={0.01}
          value={cameraSettings.startCameraDistance.value}
          onChange={updateProperty(CameraSettingsComponent, 'startCameraDistance')}
          onRelease={commitProperty(CameraSettingsComponent, 'startCameraDistance')}
          label={''}
        />
      </InputGroup>
      {/*<InputGroup name="minPhi" label={t('editor:properties.cameraSettings.lbl-phi')} containerClassName="gap-2">*/}
      {/*  <div className="flex gap-2">*/}
      {/*    <NumericInput*/}
      {/*      onChange={updateProperty(CameraSettingsComponent, 'minPhi')}*/}
      {/*      onRelease={commitProperty(CameraSettingsComponent, 'minPhi')}*/}
      {/*      min={0.001}*/}
      {/*      smallStep={0.001}*/}
      {/*      mediumStep={0.01}*/}
      {/*      largeStep={0.1}*/}
      {/*      value={cameraSettings.minPhi.value}*/}
      {/*      className="w-1/2"*/}
      {/*    />*/}
      {/*    <NumericInput*/}
      {/*      onChange={updateProperty(CameraSettingsComponent, 'maxPhi')}*/}
      {/*      onRelease={commitProperty(CameraSettingsComponent, 'maxPhi')}*/}
      {/*      min={0.001}*/}
      {/*      smallStep={0.001}*/}
      {/*      mediumStep={0.01}*/}
      {/*      largeStep={0.1}*/}
      {/*      value={cameraSettings.maxPhi.value}*/}
      {/*      className="w-1/2"*/}
      {/*    />*/}
      {/*  </div>*/}
      {/*</InputGroup>*/}
    </NodeEditor>
  )
}

CameraPropertiesNodeEditor.iconComponent = HiOutlineCamera

export default CameraPropertiesNodeEditor
