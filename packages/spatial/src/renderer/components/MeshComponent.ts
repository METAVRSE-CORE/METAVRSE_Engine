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
import { Box3, BufferGeometry, Material, Mesh } from 'three'

import { Entity, useEntityContext } from '@ir-engine/ecs'
import {
  defineComponent,
  hasComponent,
  removeComponent,
  setComponent,
  useComponent,
  useOptionalComponent
} from '@ir-engine/ecs/src/ComponentFunctions'
import { NO_PROXY, State, isHookstateValue, useImmediateEffect } from '@ir-engine/hyperflux'

import { S } from '@ir-engine/ecs'
import { useResource } from '../../resources/resourceHooks'
import { BoundingBoxComponent } from '../../transform/components/BoundingBoxComponents'
import { ObjectLayers } from '../constants/ObjectLayers'
import { ObjectComponent, addObjectToGroup, removeObjectFromGroup } from './ObjectComponent'
import { ObjectLayerComponents } from './ObjectLayerComponent'

export const MeshComponent = defineComponent({
  name: 'MeshComponent',
  jsonID: 'EE_mesh',
  schema: S.Required(S.NonSerialized(S.Type<Mesh>())),

  reactor: () => {
    const entity = useEntityContext()
    const meshComponent = useComponent(entity, MeshComponent)
    const [meshResource] = useResource(meshComponent.get(NO_PROXY), entity)
    const sceneLayer = useOptionalComponent(entity, ObjectLayerComponents[ObjectLayers.Scene])

    useImmediateEffect(() => {
      setComponent(entity, ObjectComponent, meshResource.get(NO_PROXY) as Mesh)
      return () => {
        removeComponent(entity, ObjectComponent)
      }
    }, [])

    const geometryValue = meshComponent.geometry.value
    const [geometryResource] = useResource(isHookstateValue(geometryValue) ? null : geometryValue, entity)

    const materialValue = meshComponent.material.value
    const [materialResource] = useResource(isHookstateValue(materialValue) ? null : materialValue, entity)

    useEffect(() => {
      if (!sceneLayer) return
      const box = meshComponent.geometry.boundingBox.get(NO_PROXY) as Box3 | null
      if (!box) return

      setComponent(entity, BoundingBoxComponent, { box: box })
      return () => {
        removeComponent(entity, BoundingBoxComponent)
      }
    }, [sceneLayer && meshComponent.geometry.value.boundingBox])

    useEffect(() => {
      const geometry = meshComponent.geometry.value
      if (geometry !== geometryResource.value && !isHookstateValue(geometry)) geometryResource.set(geometry)
    }, [meshComponent.geometry])

    useEffect(() => {
      const material = meshComponent.material.value

      if (material !== materialResource.value && !isHookstateValue(material)) materialResource.set(material)

      if (Array.isArray(material)) {
        material.forEach((material) => (material.needsUpdate = true))
      } else {
        ;(material as Material).needsUpdate = true
      }
    }, [meshComponent.material])

    useEffect(() => {
      const mesh = meshComponent.value
      if (mesh !== meshResource.value) {
        meshResource.set(mesh)
        setComponent(entity, ObjectComponent, meshResource.get(NO_PROXY) as Mesh)
      }
    }, [meshComponent])

    return null
  }
})

/**
 *
 * Creates a mesh component that won't be exported
 *
 * @param entity entity to add the mesh component to
 * @param geometry a Geometry instance or function returing a Geometry instance to add to the mesh
 * @param material a Material instance or function returing a Material instance to add to the mesh
 * @returns State<Mesh>
 */
export function useMeshComponent<TGeometry extends BufferGeometry, TMaterial extends Material>(
  entity: Entity,
  geometry: TGeometry | (() => TGeometry),
  material: TMaterial | (() => TMaterial)
): State<Mesh<TGeometry, TMaterial>> {
  if (!hasComponent(entity, MeshComponent)) {
    const geo = typeof geometry === 'function' ? geometry() : geometry
    const mat = typeof material === 'function' ? material() : material
    setComponent(entity, MeshComponent, new Mesh<TGeometry, TMaterial>(geo, mat))
  }

  const meshComponent = useComponent(entity, MeshComponent)

  useImmediateEffect(() => {
    const mesh = meshComponent.value as Mesh<TGeometry, TMaterial>
    mesh.userData['ignoreOnExport'] = true
    addObjectToGroup(entity, mesh)
    return () => {
      removeObjectFromGroup(entity, mesh)
      removeComponent(entity, MeshComponent)
    }
  }, [])

  return meshComponent as unknown as State<Mesh<TGeometry, TMaterial>>
}
