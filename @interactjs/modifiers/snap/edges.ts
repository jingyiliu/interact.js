/**
 * @module modifiers/snapEdges
 *
 * @description
 * This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * @example
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * })
 *
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [
 *       interact.snappers.grid({
 *        top: 50,
 *        left: 50,
 *        bottom: 100,
 *        right: 100,
 *       }),
 *     ],
 *   },
 * })
 */

import { makeModifier, ModifierArg, ModifierModule } from '../base'
import { SnapOptions, SnapState } from './pointer'
import { snapSize } from './size'
import clone from '@interactjs/utils/clone'
import extend from '@interactjs/utils/extend'

export type SnapEdgesOptions = Pick<SnapOptions, 'targets' | 'range' | 'offset' | 'endOnly' | 'enabled'>

function start (arg: ModifierArg<SnapState>) {
  const { edges } = arg

  if (!edges) { return null }

  arg.state.targetFields = arg.state.targetFields || [
    [edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom'],
  ]

  return snapSize.start(arg)
}

const snapEdges: ModifierModule<SnapEdgesOptions, SnapState> = {
  start,
  set: snapSize.set,
  defaults: extend(
    clone(snapSize.defaults),
    {
      targets: null,
      range: null,
      offset: { x: 0, y: 0 },
    } as const,
  ),
}

export default makeModifier(snapEdges, 'snapEdges')
export { snapEdges }
