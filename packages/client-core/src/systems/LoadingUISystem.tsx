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

import React, { useEffect } from 'react'
import { BackSide, Color, Mesh, MeshBasicMaterial, SphereGeometry, Vector2 } from 'three'

import { Entity, EntityTreeComponent, UndefinedEntity, useChildWithComponents } from '@ir-engine/ecs'
import {
  getComponent,
  getMutableComponent,
  hasComponent,
  removeComponent,
  setComponent,
  useComponent
} from '@ir-engine/ecs/src/ComponentFunctions'
import { ECSState } from '@ir-engine/ecs/src/ECSState'
import { Engine } from '@ir-engine/ecs/src/Engine'
import { createEntity } from '@ir-engine/ecs/src/EntityFunctions'
import { defineSystem } from '@ir-engine/ecs/src/SystemFunctions'
import { useTexture } from '@ir-engine/engine/src/assets/functions/resourceLoaderHooks'
import { GLTFComponent } from '@ir-engine/engine/src/gltf/GLTFComponent'
import { GLTFDocumentState } from '@ir-engine/engine/src/gltf/GLTFDocumentState'
import { SceneSettingsComponent } from '@ir-engine/engine/src/scene/components/SceneSettingsComponent'
import { NO_PROXY, defineState, getMutableState, getState, useHookstate, useMutableState } from '@ir-engine/hyperflux'
import { CameraComponent } from '@ir-engine/spatial/src/camera/components/CameraComponent'
import { NameComponent } from '@ir-engine/spatial/src/common/NameComponent'
import { createTransitionState } from '@ir-engine/spatial/src/common/functions/createTransitionState'
import { InputComponent } from '@ir-engine/spatial/src/input/components/InputComponent'
import { RendererComponent } from '@ir-engine/spatial/src/renderer/WebGLRendererSystem'
import { ObjectComponent } from '@ir-engine/spatial/src/renderer/components/ObjectComponent'
import { setObjectLayers } from '@ir-engine/spatial/src/renderer/components/ObjectLayerComponent'
import { VisibleComponent, setVisibleComponent } from '@ir-engine/spatial/src/renderer/components/VisibleComponent'
import { ObjectLayers } from '@ir-engine/spatial/src/renderer/constants/ObjectLayers'
import { ComputedTransformComponent } from '@ir-engine/spatial/src/transform/components/ComputedTransformComponent'
import { TransformComponent } from '@ir-engine/spatial/src/transform/components/TransformComponent'
import { ObjectFitFunctions } from '@ir-engine/spatial/src/transform/functions/ObjectFitFunctions'
import { TransformDirtyUpdateSystem } from '@ir-engine/spatial/src/transform/systems/TransformSystem'
import { XRUIComponent } from '@ir-engine/spatial/src/xrui/components/XRUIComponent'
import type { WebLayer3D } from '@ir-engine/xrui'

import { EngineState } from '@ir-engine/ecs'
import { AvatarRigComponent } from '@ir-engine/engine/src/avatar/components/AvatarAnimationComponent'
import { AvatarComponent } from '@ir-engine/engine/src/avatar/components/AvatarComponent'
import { SourceComponent } from '@ir-engine/engine/src/scene/components/SourceComponent'
import { ReferenceSpaceState } from '@ir-engine/spatial'
import { SpectateEntityState } from '@ir-engine/spatial/src/camera/systems/SpectateSystem'
import { MeshComponent } from '@ir-engine/spatial/src/renderer/components/MeshComponent'
import { useRemoveEngineCanvas } from '@ir-engine/spatial/src/renderer/functions/useEngineCanvas'
import { useLoadedSceneEntity } from '../hooks/useLoadedSceneEntity'
import { LocationState } from '../social/services/LocationService'
import { LoadingSystemState } from './state/LoadingState'
import { createLoaderDetailView } from './ui/LoadingDetailView'

const SCREEN_SIZE = new Vector2()

const transitionPeriodSeconds = 1

export const LoadingUISystemState = defineState({
  name: 'LoadingUISystemState',
  initial: () => {
    const transition = createTransitionState(transitionPeriodSeconds, 'IN')
    return {
      ui: null as null | ReturnType<typeof createLoaderDetailView>,
      colors: {
        main: '',
        background: '',
        alternate: ''
      },
      meshEntity: UndefinedEntity,
      transition,
      ready: false
    }
  },

  createLoadingUI: () => {
    const ui = createLoaderDetailView()
    getMutableComponent(ui.entity, InputComponent).grow.set(false)
    setComponent(ui.entity, NameComponent, 'Loading XRUI')

    const meshEntity = createEntity()
    const mesh = new Mesh(
      new SphereGeometry(10),
      new MeshBasicMaterial({ side: BackSide, transparent: true, depthWrite: true, depthTest: false, fog: false })
    )
    mesh.frustumCulled = false

    setComponent(meshEntity, NameComponent, 'Loading XRUI Mesh')

    setComponent(meshEntity, ComputedTransformComponent, {
      referenceEntities: [Engine.instance.viewerEntity],
      computeFunction: () => {
        getComponent(meshEntity, TransformComponent).position.copy(
          getComponent(Engine.instance.viewerEntity, TransformComponent).position
        )
      }
    })

    setComponent(meshEntity, TransformComponent)

    setComponent(ui.entity, EntityTreeComponent, { parentEntity: Engine.instance.originEntity })
    setComponent(meshEntity, EntityTreeComponent, { parentEntity: Engine.instance.originEntity })

    setComponent(meshEntity, VisibleComponent)
    setComponent(meshEntity, MeshComponent, mesh)
    mesh.renderOrder = 1
    setObjectLayers(mesh, ObjectLayers.UI)

    getComponent(meshEntity, TransformComponent).scale.set(-1, 1, -1)

    getMutableState(LoadingUISystemState).merge({
      ui,
      meshEntity
    })
  }
})

const LoadingReactor = (props: { sceneEntity: Entity }) => {
  const { sceneEntity } = props
  const gltfComponent = useComponent(sceneEntity, GLTFComponent)
  const loadingProgress = gltfComponent.progress.value
  const avatarEntity = AvatarComponent.useSelfAvatarEntity()
  const avatarLoaded = AvatarRigComponent.useAvatarLoaded(avatarEntity)
  const userID = useMutableState(EngineState).userID.value
  const spectatorLoaded = !!useMutableState(SpectateEntityState).value[userID]
  const viewerReady = avatarLoaded || spectatorLoaded
  const locationState = useMutableState(LocationState)
  const state = useMutableState(LoadingUISystemState)

  useEffect(() => {
    if (!state.ui.value) LoadingUISystemState.createLoadingUI()
  }, [])

  useEffect(() => {
    const ui = state.ui.get(NO_PROXY)!
    ui.state.progress.set(loadingProgress)
  }, [loadingProgress])

  /** Scene is loading */
  useEffect(() => {
    const transition = getState(LoadingUISystemState).transition
    if (transition.state === 'OUT' && state.ready.value && !viewerReady) transition.setState('IN')
  }, [state.ready])

  /** Scene has loaded */
  useEffect(() => {
    if (viewerReady && !state.ready.value) state.ready.set(true)
    const transition = getState(LoadingUISystemState).transition
    if (transition.state === 'IN' && viewerReady) transition.setState('OUT')
    /** used by the PWA service worker */
    /** @TODO find a better place for this */
    window.dispatchEvent(new Event('load'))
  }, [viewerReady])

  useEffect(() => {
    const ui = state.ui.get(NO_PROXY)!
    const xrui = getComponent(ui.entity!, XRUIComponent)
    const progressBar = xrui.getObjectByName('progress-container') as WebLayer3D | undefined
    if (!progressBar) return

    const scaleMultiplier = 0.01
    const centerOffset = 0.05

    progressBar.onBeforeApplyLayout = () => {
      progressBar.domLayout.position.setX(loadingProgress * scaleMultiplier * centerOffset - centerOffset)
      progressBar.domLayout.scale.setX(loadingProgress * scaleMultiplier)
    }

    progressBar.updateMatrixWorld(true)
  }, [loadingProgress])

  useEffect(() => {
    if (locationState.invalidLocation.value || locationState.currentLocation.selfNotAuthorized.value) {
      state.ready.set(true)
      const transition = getState(LoadingUISystemState).transition
      transition.setState('OUT')
      return
    }
  }, [locationState.invalidLocation, locationState.currentLocation.selfNotAuthorized])

  return (
    <>
      {!state.ready.value && <HideCanvas />}
      <SceneSettingsReactor sceneEntity={sceneEntity} key={sceneEntity} />
    </>
  )
}

const SceneSettingsReactor = (props: { sceneEntity: Entity }) => {
  const sceneSettingsEntity = useChildWithComponents(props.sceneEntity, [SceneSettingsComponent])
  if (!sceneSettingsEntity) return null
  return <SceneSettingsChildReactor entity={sceneSettingsEntity} key={sceneSettingsEntity} />
}

const SceneSettingsChildReactor = (props: { entity: Entity }) => {
  const state = useMutableState(LoadingUISystemState)
  const meshEntity = state.meshEntity.value

  const sceneComponent = useComponent(props.entity, SceneSettingsComponent)
  const [loadingTexture, error] = useTexture(sceneComponent.loadingScreenURL.value, props.entity)

  useEffect(() => {
    if (!loadingTexture) return

    const mesh = getComponent(meshEntity, ObjectComponent) as any as Mesh<SphereGeometry, MeshBasicMaterial>
    if (sceneComponent && sceneComponent.loadingScreenURL && mesh.userData.url !== sceneComponent.loadingScreenURL) {
      mesh.userData.url = sceneComponent.loadingScreenURL
    }

    mesh.material.map = loadingTexture
    mesh.material.needsUpdate = true
    mesh.material.map.needsUpdate = true
    getComponent(Engine.instance.viewerEntity, RendererComponent)
      .renderer!.compileAsync(mesh, getComponent(Engine.instance.viewerEntity, CameraComponent))
      .then(() => {
        state.ready.set(true)
      })
      .catch((error) => {
        console.error(error)
        state.ready.set(true)
      })
  }, [loadingTexture])

  useEffect(() => {
    if (!error) return

    console.error(error)
    state.ready.set(true)
  }, [error])

  /** Scene data changes */
  useEffect(() => {
    const colors = getMutableState(LoadingUISystemState).colors
    colors.main.set(sceneComponent.primaryColor.value)
    colors.background.set(sceneComponent.backgroundColor.value)
    colors.alternate.set(sceneComponent.alternativeColor.value)

    return () => {
      colors.main.set('black')
      colors.background.set('white')
      colors.alternate.set('black')
    }
  }, [sceneComponent])

  return null
}

const HideCanvas = () => {
  useRemoveEngineCanvas()
  return null
}

const mainThemeColor = new Color()
const defaultColor = new Color()

const execute = () => {
  const { transition, ui, meshEntity, colors, ready } = getState(LoadingUISystemState)
  if (!ui) return

  const ecsState = getState(ECSState)

  if (transition.state === 'OUT' && transition.alpha === 0) {
    removeComponent(ui.entity, ComputedTransformComponent)
    return
  }

  const xrui = getComponent(ui.entity, XRUIComponent)

  if (transition.state === 'IN' && transition.alpha === 1) {
    if (!hasComponent(ui.entity, ComputedTransformComponent))
      setComponent(ui.entity, ComputedTransformComponent, {
        referenceEntities: [Engine.instance.cameraEntity],
        computeFunction: () => {
          const camera = getComponent(Engine.instance.cameraEntity, CameraComponent)
          const distance = camera.near * 1.1 // 10% in front of camera
          const uiContainer = ui.container.rootLayer.querySelector('#loading-ui')
          if (!uiContainer) return
          const uiSize = uiContainer.domSize
          const screenSize = getComponent(Engine.instance.viewerEntity, RendererComponent).renderer!.getSize(
            SCREEN_SIZE
          )
          const aspectRatio = screenSize.x / screenSize.y
          const scaleMultiplier = aspectRatio < 1 ? 1 / aspectRatio : 1
          const scale =
            ObjectFitFunctions.computeContentFitScaleForCamera(distance, uiSize.x, uiSize.y, 'contain') *
            0.25 *
            scaleMultiplier
          ObjectFitFunctions.attachObjectInFrontOfCamera(ui.entity, scale, distance)
        }
      })
  }

  // add a slow rotation to animate on desktop, otherwise just keep it static for VR
  // getComponent(Engine.instance.cameraEntity, CameraComponent).rotateY(world.delta * 0.35)

  mainThemeColor.set(colors.alternate)

  transition.update(ecsState.deltaSeconds, (opacity) => {
    getMutableState(LoadingSystemState).loadingScreenOpacity.set(opacity)
  })

  const opacity = getState(LoadingSystemState).loadingScreenOpacity
  const isReady = opacity > 0 && ready

  setVisibleComponent(meshEntity, isReady)

  const mesh = getComponent(meshEntity, ObjectComponent) as any as Mesh<SphereGeometry, MeshBasicMaterial>
  mesh.material.opacity = opacity

  xrui.rootLayer.traverseLayersPreOrder((layer: WebLayer3D) => {
    const mat = layer.contentMesh.material as MeshBasicMaterial
    mat.opacity = opacity
    mat.visible = isReady
    layer.visible = isReady
    // mat.color.lerpColors(defaultColor, mainThemeColor, engineState.loadingProgress * 0.01)
    mat.color.copy(mainThemeColor)
  })
  setVisibleComponent(ui.entity, isReady)
}

const Reactor = () => {
  const locationSceneURL = useHookstate(getMutableState(LocationState).currentLocation.location.sceneURL).value
  const sceneEntity = useLoadedSceneEntity(locationSceneURL)
  const gltfDocumentState = useMutableState(GLTFDocumentState)

  if (!sceneEntity) return null

  // wait for scene gltf to load
  if (!gltfDocumentState[getComponent(sceneEntity, SourceComponent)]) return null

  return (
    <>
      <LoadingReactor sceneEntity={sceneEntity} key={sceneEntity} />
    </>
  )
}

export const LoadingUISystem = defineSystem({
  uuid: 'ee.client.LoadingUISystem',
  insert: { before: TransformDirtyUpdateSystem },
  execute,
  reactor: () => {
    if (!useMutableState(ReferenceSpaceState).viewerEntity.value) return null
    return <Reactor />
  }
})
