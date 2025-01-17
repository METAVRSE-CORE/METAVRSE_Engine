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

import { Mesh, Object3D } from 'three'

import { Entity, getComponent, hasComponent, iterateEntityNode, removeComponent, UndefinedEntity } from '@ir-engine/ecs'
import { MeshComponent } from '@ir-engine/spatial/src/renderer/components/MeshComponent'

import { GroundPlaneComponent } from '../../../../scene/components/GroundPlaneComponent'
import { ImageComponent } from '../../../../scene/components/ImageComponent'
import { PrimitiveGeometryComponent } from '../../../../scene/components/PrimitiveGeometryComponent'
import { GLTFExporterPlugin, GLTFWriter } from '../GLTFExporter'
import { ExporterExtension } from './ExporterExtension'

export default class IgnoreGeometryExporterExtension extends ExporterExtension implements GLTFExporterPlugin {
  entitySet: { entity: Entity; parent: Entity }[]
  meshSet: { mesh: Mesh; parent: Entity }[]
  constructor(writer: GLTFWriter) {
    super(writer)
    this.name = 'EE_ignoreGeometry'
    this.entitySet = [] as { entity: Entity; parent: Entity }[]
    this.meshSet = [] as { mesh: Mesh; parent: Entity }[]
  }
  beforeParse(input: Object3D | Object3D[]) {
    const root = (Array.isArray(input) ? input[0] : input) as Object3D
    iterateEntityNode(root.entity ?? UndefinedEntity, (entity) => {
      if (!hasComponent(entity, MeshComponent)) return
      const mesh = getComponent(entity, MeshComponent)
      const removeMesh =
        hasComponent(entity, PrimitiveGeometryComponent) ||
        hasComponent(entity, GroundPlaneComponent) ||
        hasComponent(entity, ImageComponent) ||
        !!mesh.userData['ignoreOnExport']
      if (!removeMesh) return
      removeComponent(entity, MeshComponent)
    })
  }
}
