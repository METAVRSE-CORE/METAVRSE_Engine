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

import { Types } from '@ir-engine/ecs'
import { strictEqual } from 'assert'
import { afterEach, beforeEach, describe, it } from 'vitest'

import { defineComponent, hasComponent, setComponent } from '@ir-engine/ecs/src/ComponentFunctions'
import { ECSState } from '@ir-engine/ecs/src/ECSState'
import { createEngine, destroyEngine, Engine } from '@ir-engine/ecs/src/Engine'
import { Entity } from '@ir-engine/ecs/src/Entity'
import { createEntity } from '@ir-engine/ecs/src/EntityFunctions'
import { getMutableState, getState, PeerID, UserID } from '@ir-engine/hyperflux'
import { NetworkId } from '@ir-engine/network/src/NetworkId'

import { createMockNetwork } from '../../tests/createMockNetwork'
import { roundNumberToPlaces } from '../../tests/MathTestUtils'
import { Network, NetworkTopics } from '../Network'
import { NetworkObjectComponent, NetworkObjectSendPeriodicUpdatesTag } from '../NetworkObjectComponent'
import { NetworkState } from '../NetworkState'
import { checkBitflag, readCompressedRotation, readCompressedVector3, readVector3, readVector4 } from './DataReader'
import {
  createDataWriter,
  writeComponent,
  writeCompressedRotation,
  writeCompressedVector3,
  writeEntities,
  writeEntity,
  writeVector3,
  writeVector4
} from './DataWriter'
import {
  createViewCursor,
  readFloat64,
  readUint32,
  readUint8,
  rewindViewCursor,
  sliceViewCursor,
  spaceUint8,
  ViewCursor
} from './ViewCursor'

const { f64 } = Types

const MockPoseComponent = defineComponent({
  name: 'MockPoseComponent_Writer',
  schema: {
    Vec3: { x: f64, y: f64, z: f64 },
    Quat: { x: f64, y: f64, z: f64, w: f64 }
  }
})

const readPosition = readVector3(MockPoseComponent.Vec3)
const writePosition = writeVector3(MockPoseComponent.Vec3)
const readRotation = readVector4(MockPoseComponent.Quat)
const writeRotation = writeVector4(MockPoseComponent.Quat)

describe('DataWriter', () => {
  beforeEach(() => {
    createEngine()
    createMockNetwork(NetworkTopics.world, 'host peer id' as PeerID, 'host user id' as UserID)

    getMutableState(NetworkState).networkSchema.merge({
      mock: {
        read: (v: ViewCursor, entity: Entity) => {
          const changeMask = readUint8(v)
          let b = 0
          if (checkBitflag(changeMask, 1 << b++)) readPosition(v, entity)
          if (checkBitflag(changeMask, 1 << b++)) readRotation(v, entity)
        },
        write: (v: ViewCursor, entity: Entity) => {
          const rewind = rewindViewCursor(v)
          const writeChangeMask = spaceUint8(v)
          let changeMask = 0
          let b = 0

          const ignoreHasChanged =
            hasComponent(entity, NetworkObjectSendPeriodicUpdatesTag) &&
            Math.round(getState(ECSState).simulationTime % getState(ECSState).periodicUpdateFrequency) === 0

          changeMask |= writePosition(v, entity, ignoreHasChanged) ? 1 << b++ : b++ && 0
          changeMask |= writeRotation(v, entity, ignoreHasChanged) ? 1 << b++ : b++ && 0

          return (changeMask > 0 && writeChangeMask(changeMask)) || rewind()
        }
      }
    })
    const ecsState = getMutableState(ECSState)
    ecsState.simulationTime.set(1)
  })

  afterEach(() => {
    return destroyEngine()
  })

  it('should writeComponent', () => {
    const writeView = createViewCursor()
    const entity = createEntity()

    const [x, y, z] = [1.5, 2.5, 3.5]
    setComponent(entity, MockPoseComponent)
    MockPoseComponent.Vec3.x[entity] = x
    MockPoseComponent.Vec3.y[entity] = y
    MockPoseComponent.Vec3.z[entity] = z

    const writePosition = writeComponent(MockPoseComponent.Vec3)

    writePosition(writeView, entity)

    const testView = createViewCursor(writeView.buffer)

    strictEqual(writeView.cursor, 1 * Uint8Array.BYTES_PER_ELEMENT + 3 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(readUint8(testView), 0b111)
    strictEqual(readFloat64(testView), x)
    strictEqual(readFloat64(testView), y)
    strictEqual(readFloat64(testView), z)

    sliceViewCursor(writeView)

    MockPoseComponent.Vec3.x[entity]++
    MockPoseComponent.Vec3.z[entity]++

    writePosition(writeView, entity)

    const readView = createViewCursor(writeView.buffer)

    strictEqual(writeView.cursor, 1 * Uint8Array.BYTES_PER_ELEMENT + 2 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(readUint8(readView), 0b101)
    strictEqual(readFloat64(readView), x + 1)
    strictEqual(readFloat64(readView), z + 1)
  })

  it('should writeVector3', () => {
    const writeView = createViewCursor()
    const entity = createEntity()

    const [x, y, z] = [1.5, 2.5, 3.5]
    MockPoseComponent.Vec3.x[entity] = x
    MockPoseComponent.Vec3.y[entity] = y
    MockPoseComponent.Vec3.z[entity] = z

    writeVector3(MockPoseComponent.Vec3)(writeView, entity)

    const testView = createViewCursor(writeView.buffer)

    strictEqual(writeView.cursor, 1 * Uint8Array.BYTES_PER_ELEMENT + 3 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(readUint8(testView), 0b111)
    strictEqual(readFloat64(testView), x)
    strictEqual(readFloat64(testView), y)
    strictEqual(readFloat64(testView), z)

    sliceViewCursor(writeView)

    MockPoseComponent.Vec3.x[entity]++
    MockPoseComponent.Vec3.z[entity]++

    writeVector3(MockPoseComponent.Vec3)(writeView, entity)

    const readView = createViewCursor(writeView.buffer)

    strictEqual(writeView.cursor, 1 * Uint8Array.BYTES_PER_ELEMENT + 2 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(readUint8(readView), 0b101)
    strictEqual(readFloat64(readView), x + 1)
    strictEqual(readFloat64(readView), z + 1)
  })

  it('should writePosition', () => {
    const writeView = createViewCursor()
    const entity = createEntity()

    const [x, y, z] = [1.5, 2.5, 3.5]
    MockPoseComponent.Vec3.x[entity] = x
    MockPoseComponent.Vec3.y[entity] = y
    MockPoseComponent.Vec3.z[entity] = z

    writePosition(writeView, entity)

    const readView = createViewCursor(writeView.buffer)

    strictEqual(writeView.cursor, 1 * Uint8Array.BYTES_PER_ELEMENT + 3 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(readUint8(readView), 0b111)
    strictEqual(readFloat64(readView), x)
    strictEqual(readFloat64(readView), y)
    strictEqual(readFloat64(readView), z)
  })

  it('should writeCompressedRotation', () => {
    const writeView = createViewCursor()
    const entity = createEntity()
    setComponent(entity, NetworkObjectSendPeriodicUpdatesTag)

    // construct values for a valid quaternion
    const [a, b, c] = [0.167, 0.167, 0.167]
    let d = Math.sqrt(1 - (a * a + b * b + c * c))

    const [x, y, z, w] = [a, b, c, d]
    MockPoseComponent.Quat.x[entity] = x
    MockPoseComponent.Quat.y[entity] = y
    MockPoseComponent.Quat.z[entity] = z
    MockPoseComponent.Quat.w[entity] = w

    writeCompressedRotation(MockPoseComponent.Quat)(writeView, entity)

    const readView = createViewCursor(writeView.buffer)
    readCompressedRotation(MockPoseComponent.Quat)(readView, entity)

    strictEqual(readView.cursor, Uint8Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT)

    // Round values to 3 decimal places and compare
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.x[entity], 3), roundNumberToPlaces(x, 3))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.y[entity], 3), roundNumberToPlaces(y, 3))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.z[entity], 3), roundNumberToPlaces(z, 3))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.w[entity], 3), roundNumberToPlaces(w, 3))
  })

  it('should writeCompressedVector3', () => {
    const writeView = createViewCursor()
    const entity = createEntity()
    setComponent(entity, NetworkObjectSendPeriodicUpdatesTag)

    const [x, y, z] = [1.333, 2.333, 3.333]
    MockPoseComponent.Vec3.x[entity] = x
    MockPoseComponent.Vec3.y[entity] = y
    MockPoseComponent.Vec3.z[entity] = z

    writeCompressedVector3(MockPoseComponent.Vec3)(writeView, entity)

    const readView = createViewCursor(writeView.buffer)
    readCompressedVector3(MockPoseComponent.Vec3)(readView, entity)

    strictEqual(readView.cursor, Uint8Array.BYTES_PER_ELEMENT + Uint32Array.BYTES_PER_ELEMENT)

    // Round values and compare
    strictEqual(roundNumberToPlaces(MockPoseComponent.Vec3.x[entity], 1), roundNumberToPlaces(x, 1))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Vec3.y[entity], 1), roundNumberToPlaces(y, 1))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Vec3.z[entity], 1), roundNumberToPlaces(z, 1))
  })

  // it('should writeXRHands', () => {
  //   const writeView = createViewCursor()
  //   const entity = createEntity()

  //   let joints = []
  //   XRHandBones.forEach((bone) => {
  //     joints = joints.concat(bone as any)
  //   })

  //   // construct values for a valid quaternion
  //   const [a, b, c] = [0.167, 0.167, 0.167]
  //   let d = Math.sqrt(1 - (a * a + b * b + c * c))

  //   const [posX, posY, posZ] = [1.5, 2.5, 3.5]
  //   const [rotX, rotY, rotZ, rotW] = [a, b, c, d]

  //   const hands = [new Group(), new Group()]
  //   hands[0].userData.handedness = 'left'
  //   hands[1].userData.handedness = 'right'

  //   hands.forEach((hand) => {
  //     // setup mock hand state
  //     const handedness = hand.userData.handedness
  //     const dummyXRHandMeshModel = new Group() as any
  //     dummyXRHandMeshModel.handedness = handedness
  //     hand.userData.mesh = dummyXRHandMeshModel

  //     // proxify and copy values
  //     joints.forEach((jointName) => {
  //       proxifyVector3(XRHandsInputComponent[handedness][jointName].position, entity).set(posX, posY, posZ)
  //       proxifyQuaternion(XRHandsInputComponent[handedness][jointName].quaternion, entity).set(rotX, rotY, rotZ, rotW)
  //     })
  //   })

  //   // add component
  //   addComponent(entity, XRHandsInputComponent, { hands: hands })

  //   writeXRHands(writeView, entity)

  //   const readView = createViewCursor(writeView.buffer)

  //   // ChangeMask details
  //   // For each entity
  //   // 1 - changeMask (uint16) for writeXRHands
  //   // For each hand
  //   // 1 - changeMask (uint16) for each hand
  //   // 1 - changeMask (uint8) for each hand handedness
  //   // 6 - changeMask (uint16) for each hand bone
  //   // 2 - changeMask (uint8) for pos and rot of each joint
  //   const numOfHands = hands.length
  //   const numOfJoints = joints.length
  //   strictEqual(
  //     writeView.cursor,
  //     1 * Uint16Array.BYTES_PER_ELEMENT +
  //       (1 * Uint16Array.BYTES_PER_ELEMENT +
  //         1 * Uint8Array.BYTES_PER_ELEMENT +
  //         6 * Uint16Array.BYTES_PER_ELEMENT +
  //         (2 * Uint8Array.BYTES_PER_ELEMENT + 3 * Float64Array.BYTES_PER_ELEMENT + 1 * Uint32Array.BYTES_PER_ELEMENT) *
  //           numOfJoints) *
  //         numOfHands
  //   )

  //   strictEqual(readUint16(readView), 0b11)

  //   hands.forEach((hand) => {
  //     const handedness = hand.userData.handedness
  //     const handednessBitValue = handedness === 'left' ? 0 : 1

  //     readUint16(readView)
  //     // strictEqual(readUint16(readView), 0b111111)
  //     strictEqual(readUint8(readView), handednessBitValue)

  //     XRHandBones.forEach((bone) => {
  //       readUint16(readView)
  //       // strictEqual(readUint16(readView), 0b11)

  //       bone.forEach((joint) => {
  //         strictEqual(readUint8(readView), 0b111)
  //         strictEqual(readFloat64(readView), posX)
  //         strictEqual(readFloat64(readView), posY)
  //         strictEqual(readFloat64(readView), posZ)

  //         readRotation(readView, entity)

  //         // Round values to 3 decimal places and compare
  //         strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.x[entity], 3), roundNumberToPlaces(rotX, 3))
  //         strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.y[entity], 3), roundNumberToPlaces(rotY, 3))
  //         strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.z[entity], 3), roundNumberToPlaces(rotZ, 3))
  //         strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.w[entity], 3), roundNumberToPlaces(rotW, 3))
  //       })
  //     })
  //   })
  // })

  it('should writeEntity with only TransformComponent', () => {
    const writeView = createViewCursor()
    const entity = createEntity()
    const networkId = 999 as NetworkId
    const network = NetworkState.worldNetwork as Network
    const userID = network.hostUserID!
    const peerID = network.hostPeerID!
    const ownerIndex = 0

    // construct values for a valid quaternion
    const [a, b, c] = [0.167, 0.167, 0.167]
    let d = Math.sqrt(1 - (a * a + b * b + c * c))

    const [posX, posY, posZ] = [1.5, 2.5, 3.5]
    const [rotX, rotY, rotZ, rotW] = [a, b, c, d]

    MockPoseComponent.Vec3.x[entity] = posX
    MockPoseComponent.Vec3.y[entity] = posY
    MockPoseComponent.Vec3.z[entity] = posZ
    MockPoseComponent.Quat.x[entity] = rotX
    MockPoseComponent.Quat.y[entity] = rotY
    MockPoseComponent.Quat.z[entity] = rotZ
    MockPoseComponent.Quat.w[entity] = rotW

    setComponent(entity, NetworkObjectComponent, {
      networkId,
      ownerPeer: peerID,
      authorityPeerID: peerID,
      ownerId: userID
    })

    NetworkObjectComponent.networkId[entity] = networkId

    writeEntity(writeView, networkId, ownerIndex, entity, Object.values(getState(NetworkState).networkSchema))

    const readView = createViewCursor(writeView.buffer)

    strictEqual(
      writeView.cursor,
      2 * Uint32Array.BYTES_PER_ELEMENT +
        4 * Uint8Array.BYTES_PER_ELEMENT +
        3 * Float64Array.BYTES_PER_ELEMENT +
        4 * Float64Array.BYTES_PER_ELEMENT
    )

    // read networkId
    strictEqual(readUint32(readView), networkId)

    // read owner index
    strictEqual(readUint32(readView), ownerIndex)

    // read writeEntity changeMask (only reading TransformComponent)
    strictEqual(readUint8(readView), 0b01)

    // read writeTransform changeMask
    strictEqual(readUint8(readView), 0b11)

    // read writePosition changeMask
    strictEqual(readUint8(readView), 0b111)

    // read position values
    strictEqual(readFloat64(readView), posX)
    strictEqual(readFloat64(readView), posY)
    strictEqual(readFloat64(readView), posZ)

    // read rotation values
    readRotation(readView, entity)

    // Round values to 3 decimal places and compare
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.x[entity], 3), roundNumberToPlaces(rotX, 3))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.y[entity], 3), roundNumberToPlaces(rotY, 3))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.z[entity], 3), roundNumberToPlaces(rotZ, 3))
    strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.w[entity], 3), roundNumberToPlaces(rotW, 3))
  })

  it('should writeEntities', () => {
    const writeView = createViewCursor()

    const n = 5
    const entities: Entity[] = Array(n)
      .fill(0)
      .map(() => createEntity())

    // construct values for a valid quaternion
    const [a, b, c] = [0.167, 0.167, 0.167]
    let d = Math.sqrt(1 - (a * a + b * b + c * c))

    const [posX, posY, posZ] = [1.5, 2.5, 3.5]
    const [rotX, rotY, rotZ, rotW] = [a, b, c, d]

    const network = NetworkState.worldNetwork as Network
    const userID = network.hostUserID!
    const peerID = network.hostPeerID!

    const peerIndex = 0

    entities.forEach((entity) => {
      const networkId = entity as unknown as NetworkId
      setComponent(entity, NetworkObjectComponent)
      NetworkObjectComponent.networkId[entity] = networkId

      setComponent(entity, MockPoseComponent)
      MockPoseComponent.Vec3.x[entity] = posX
      MockPoseComponent.Vec3.y[entity] = posY
      MockPoseComponent.Vec3.z[entity] = posZ
      MockPoseComponent.Quat.x[entity] = rotX
      MockPoseComponent.Quat.y[entity] = rotY
      MockPoseComponent.Quat.z[entity] = rotZ
      MockPoseComponent.Quat.w[entity] = rotW

      setComponent(entity, NetworkObjectComponent, {
        networkId,
        ownerPeer: peerID,
        authorityPeerID: peerID,
        ownerId: userID
      })
    })

    writeEntities(writeView, network, entities)
    const packet = sliceViewCursor(writeView)

    const expectedBytes =
      1 * Uint32Array.BYTES_PER_ELEMENT +
      n *
        (2 * Uint32Array.BYTES_PER_ELEMENT +
          4 * Uint8Array.BYTES_PER_ELEMENT +
          3 * Float64Array.BYTES_PER_ELEMENT +
          4 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(writeView.cursor, 0)
    strictEqual(packet.byteLength, expectedBytes)

    const readView = createViewCursor(writeView.buffer)

    const count = readUint32(readView)
    strictEqual(count, entities.length)

    for (let i = 0; i < count; i++) {
      // read networkId
      strictEqual(readUint32(readView), entities[i])

      // read owner index
      strictEqual(readUint32(readView), peerIndex)

      // read writeEntity changeMask (only reading TransformComponent)
      strictEqual(readUint8(readView), 0b01)

      // read writeTransform changeMask
      strictEqual(readUint8(readView), 0b11)

      // read writePosition changeMask
      strictEqual(readUint8(readView), 0b111)

      // read position values
      strictEqual(readFloat64(readView), posX)
      strictEqual(readFloat64(readView), posY)
      strictEqual(readFloat64(readView), posZ)

      // read rotation values
      readRotation(readView, entities[i])

      // Round values to 3 decimal places and compare
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.x[entities[i]], 3), roundNumberToPlaces(rotX, 3))
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.y[entities[i]], 3), roundNumberToPlaces(rotY, 3))
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.z[entities[i]], 3), roundNumberToPlaces(rotZ, 3))
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.w[entities[i]], 3), roundNumberToPlaces(rotW, 3))
    }
  })

  it('should createDataWriter', () => {
    const peerID = Engine.instance.store.peerID

    const write = createDataWriter()

    const n = 50
    const entities: Entity[] = Array(n)
      .fill(0)
      .map(() => createEntity())

    // construct values for a valid quaternion
    const [a, b, c] = [0.167, 0.167, 0.167]
    let d = Math.sqrt(1 - (a * a + b * b + c * c))

    const [posX, posY, posZ] = [1.5, 2.5, 3.5]
    const [rotX, rotY, rotZ, rotW] = [a, b, c, d]

    const network = NetworkState.worldNetwork as Network

    const userID = 'userId' as unknown as UserID & PeerID
    const peerIndex = 0
    network.peerIDToPeerIndex[peerID] = peerIndex
    network.peerIndexToPeerID[peerIndex] = peerID

    entities.forEach((entity) => {
      const networkId = entity as unknown as NetworkId
      setComponent(entity, NetworkObjectComponent)
      NetworkObjectComponent.networkId[entity] = networkId

      setComponent(entity, MockPoseComponent)
      MockPoseComponent.Vec3.x[entity] = posX
      MockPoseComponent.Vec3.y[entity] = posY
      MockPoseComponent.Vec3.z[entity] = posZ
      MockPoseComponent.Quat.x[entity] = rotX
      MockPoseComponent.Quat.y[entity] = rotY
      MockPoseComponent.Quat.z[entity] = rotZ
      MockPoseComponent.Quat.w[entity] = rotW

      setComponent(entity, NetworkObjectComponent, {
        networkId,
        ownerPeer: peerID,
        authorityPeerID: userID,
        ownerId: userID
      })
    })

    const packet = write(network, Engine.instance.store.peerID, entities)

    const expectedBytes =
      2 * Uint32Array.BYTES_PER_ELEMENT +
      1 * Float64Array.BYTES_PER_ELEMENT +
      n *
        (2 * Uint32Array.BYTES_PER_ELEMENT +
          4 * Uint8Array.BYTES_PER_ELEMENT +
          3 * Float64Array.BYTES_PER_ELEMENT +
          4 * Float64Array.BYTES_PER_ELEMENT)

    strictEqual(packet.byteLength, expectedBytes)

    const readView = createViewCursor(packet)

    const _peerIndex = readUint32(readView)
    const _tick = readFloat64(readView)

    const count = readUint32(readView)
    strictEqual(count, entities.length)

    for (let i = 0; i < count; i++) {
      // read networkId
      strictEqual(readUint32(readView), entities[i])

      // read owner index
      strictEqual(readUint32(readView), peerIndex)

      // read writeEntity changeMask (only reading TransformComponent)
      strictEqual(readUint8(readView), 0b01)

      // read writeTransform changeMask
      strictEqual(readUint8(readView), 0b11)

      // read writePosition changeMask
      strictEqual(readUint8(readView), 0b111)

      // read position values
      strictEqual(readFloat64(readView), posX)
      strictEqual(readFloat64(readView), posY)
      strictEqual(readFloat64(readView), posZ)

      // read rotation values
      readRotation(readView, entities[i])

      // Round values to 3 decimal places and compare
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.x[entities[i]], 3), roundNumberToPlaces(rotX, 3))
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.y[entities[i]], 3), roundNumberToPlaces(rotY, 3))
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.z[entities[i]], 3), roundNumberToPlaces(rotZ, 3))
      strictEqual(roundNumberToPlaces(MockPoseComponent.Quat.w[entities[i]], 3), roundNumberToPlaces(rotW, 3))
    }
  })
})
