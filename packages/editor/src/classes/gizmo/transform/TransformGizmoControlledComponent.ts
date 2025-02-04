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

import { useEffect } from 'react'
import { Box3, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'

import { Engine, Entity, EntityTreeComponent, UndefinedEntity } from '@ir-engine/ecs'
import { defineComponent, getComponent, setComponent, useComponent } from '@ir-engine/ecs/src/ComponentFunctions'
import { createEntity, removeEntity, useEntityContext } from '@ir-engine/ecs/src/EntityFunctions'
import { TransformPivot } from '@ir-engine/engine/src/scene/constants/transformConstants'
import { useHookstate, useMutableState } from '@ir-engine/hyperflux'
import { TransformComponent } from '@ir-engine/spatial'
import { NameComponent } from '@ir-engine/spatial/src/common/NameComponent'
import { VisibleComponent } from '@ir-engine/spatial/src/renderer/components/VisibleComponent'
import { TransformGizmoTagComponent } from '@ir-engine/spatial/src/transform/components/TransformComponent'

import { S } from '@ir-engine/ecs/src/schemas/JSONSchemas'
import { InputComponent } from '@ir-engine/spatial/src/input/components/InputComponent'
import { MeshComponent } from '@ir-engine/spatial/src/renderer/components/MeshComponent'
import { ObjectLayerMaskComponent } from '@ir-engine/spatial/src/renderer/components/ObjectLayerComponent'
import { ObjectLayers } from '@ir-engine/spatial/src/renderer/constants/ObjectLayers'
import { EditorHelperState } from '../../../services/EditorHelperState'
import { SelectionState } from '../../../services/SelectionServices'
import { TransformGizmoControlComponent } from './TransformGizmoControlComponent'
import { TransformGizmoVisualComponent } from './TransformGizmoVisualComponent'

export const TransformGizmoControlledComponent = defineComponent({
  name: 'TransformGizmoControlled',

  schema: S.Object({ controller: S.Entity() }),

  reactor: function (props) {
    const entity = useEntityContext()
    const transformGizmoControlledComponent = useComponent(entity, TransformGizmoControlledComponent)
    const selectedEntities = SelectionState.useSelectedEntities()
    const editorHelperState = useMutableState(EditorHelperState)
    const box = useHookstate(() => new Box3())

    const createPivotEntity = () => {
      const pivotEntity = createEntity()
      setComponent(pivotEntity, NameComponent, 'gizmoPivotEntity')
      setComponent(pivotEntity, TransformComponent)
      setComponent(pivotEntity, VisibleComponent)
      setComponent(pivotEntity, EntityTreeComponent, { parentEntity: Engine.instance.originEntity })
      setComponent(pivotEntity, TransformGizmoTagComponent)

      /*addObjectToGroup(
        pivotEntity,
        new Mesh(new SphereGeometry(1.5, 32, 32), new MeshBasicMaterial({ color: 0xff0000 }))
      )*/
      // useful for debug so leaving it here
      return pivotEntity
    }

    useEffect(() => {
      const gizmoVisualEntity = createEntity()
      setComponent(gizmoVisualEntity, EntityTreeComponent, { parentEntity: Engine.instance.originEntity })
      setComponent(gizmoVisualEntity, NameComponent, 'gizmoVisualEntity')
      setComponent(gizmoVisualEntity, TransformGizmoVisualComponent)
      setComponent(gizmoVisualEntity, TransformGizmoTagComponent)
      setComponent(gizmoVisualEntity, VisibleComponent)
      setComponent(gizmoVisualEntity, TransformComponent)
      ObjectLayerMaskComponent.setLayer(gizmoVisualEntity, ObjectLayers.TransformGizmo)

      const gizmoPlaneEntity = createEntity()
      setComponent(gizmoPlaneEntity, EntityTreeComponent, { parentEntity: Engine.instance.originEntity })
      setComponent(gizmoPlaneEntity, NameComponent, 'gizmoPlaneEntity')
      setComponent(gizmoPlaneEntity, TransformComponent)
      setComponent(gizmoPlaneEntity, InputComponent)

      const gizmoPlane = new Mesh(
        new PlaneGeometry(100000, 100000, 2, 2),
        new MeshBasicMaterial({
          visible: false,
          wireframe: true,
          side: DoubleSide,
          transparent: true,
          opacity: 0.1,
          toneMapped: false
        })
      )

      setComponent(gizmoPlaneEntity, MeshComponent, gizmoPlane)
      setComponent(gizmoPlaneEntity, TransformGizmoTagComponent)
      ObjectLayerMaskComponent.setLayer(gizmoPlaneEntity, ObjectLayers.TransformGizmo)

      const gizmoControlEntity = createEntity()
      setComponent(gizmoControlEntity, EntityTreeComponent, { parentEntity: Engine.instance.originEntity })
      setComponent(gizmoControlEntity, NameComponent, 'gizmoControllerEntity')
      setComponent(gizmoControlEntity, TransformGizmoControlComponent, {
        controlledEntities: [entity],
        visualEntity: gizmoVisualEntity,
        planeEntity: gizmoPlaneEntity
      })
      setComponent(gizmoControlEntity, TransformGizmoTagComponent)
      setComponent(gizmoControlEntity, VisibleComponent)
      setComponent(gizmoControlEntity, TransformComponent)

      transformGizmoControlledComponent.controller.set(gizmoControlEntity)

      return () => {
        removeEntity(gizmoControlEntity)
        removeEntity(gizmoVisualEntity)
        removeEntity(gizmoPlaneEntity)
      }
    }, [])

    useEffect(() => {
      if (selectedEntities.length <= 1) return
      const controlledEntities = selectedEntities
      const existingPivot = getComponent(
        transformGizmoControlledComponent.controller.value,
        TransformGizmoControlComponent
      ).pivotEntity
      const pivot = existingPivot === UndefinedEntity ? createPivotEntity() : existingPivot
      setComponent(transformGizmoControlledComponent.controller.value, TransformGizmoControlComponent, {
        controlledEntities: controlledEntities,
        pivotEntity: pivot
      })
      return () => {
        setComponent(transformGizmoControlledComponent.controller.value, TransformGizmoControlComponent, {
          pivotEntity: UndefinedEntity
        })
        removeEntity(pivot)
      }
    }, [selectedEntities])

    useEffect(() => {
      if (selectedEntities.length <= 1) return
      const controlledEntities = selectedEntities
      const pivot = getComponent(
        transformGizmoControlledComponent.controller.value,
        TransformGizmoControlComponent
      ).pivotEntity
      if (pivot === UndefinedEntity) return

      const newPosition = new Vector3()
      TransformComponent.getWorldPosition(pivot, newPosition)

      switch (editorHelperState.transformPivot.value) {
        case TransformPivot.Origin:
          newPosition.setScalar(0)
          break
        case TransformPivot.FirstSelected:
          TransformComponent.getWorldPosition(controlledEntities[0], newPosition)
          break
        case TransformPivot.Center:
          getMidpointWorldPosition(controlledEntities, newPosition)
          break
        case TransformPivot.BoundingBox:
        case TransformPivot.BoundingBoxBottom:
          box.value.makeEmpty()

          for (let i = 0; i < controlledEntities.length; i++) {
            const parentEnt = controlledEntities[i]
            box.value.expandByPoint(getComponent(parentEnt, TransformComponent).position)
          }
          box.value.getCenter(newPosition)

          if (editorHelperState.transformPivot.value === TransformPivot.BoundingBoxBottom)
            newPosition.y = box.min.y.value
          break
      }

      setComponent(pivot, TransformComponent, { position: newPosition })
    }, [editorHelperState.transformPivot, selectedEntities])

    return null
  }
})

const getMidpointWorldPosition = (entities: Entity[], outVec3: Vector3) => {
  outVec3.set(0, 0, 0)
  const position = new Vector3()
  for (const entity of entities) {
    TransformComponent.getWorldPosition(entity, position)
    outVec3.add(position)
  }
  outVec3.divideScalar(entities.length)
}
