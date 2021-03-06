import { Modifier, ModifierArg, ModifierState } from './base'
import clone from '@interactjs/utils/clone'
import extend from '@interactjs/utils/extend'
import * as rectUtils from '@interactjs/utils/rect'

export interface ModificationResult {
  delta: Interact.Point
  rectDelta: Interact.Rect
  coords: Interact.Point
  rect: Interact.FullRect
  eventProps: any[]
  changed: boolean
}

interface MethodArg {
  phase: Interact.EventPhase
  pageCoords?: Interact.Point
  rect?: Interact.FullRect
  coords?: Interact.Point
  preEnd?: boolean
  skipModifiers?: number
}

export default class Modification {
  states: ModifierState[] = []
  startOffset: Interact.Rect = { left: 0, right: 0, top: 0, bottom: 0 }
  startDelta: Interact.Point = null
  result?: ModificationResult = null
  endResult?: Interact.Point = null
  edges: Interact.EdgeOptions
  readonly interaction: Readonly<Interact.Interaction>

  constructor (interaction: Interact.Interaction) {
    this.interaction = interaction
    this.result = createResult()
  }

  start (
    { phase }: MethodArg,
    pageCoords: Interact.Point,
  ) {
    const { interaction } = this
    const modifierList = getModifierList(interaction)
    this.prepareStates(modifierList)

    this.edges = extend({}, interaction.edges)
    this.startOffset = getRectOffset(interaction.rect, pageCoords)
    this.startDelta = { x: 0, y: 0 }

    const arg: MethodArg = {
      phase,
      pageCoords,
      preEnd: false,
    }

    this.result = createResult()
    this.startAll(arg)

    const result = this.result = this.setAll(arg)

    return result
  }

  fillArg (arg: Partial<ModifierArg>) {
    const { interaction } = this

    arg.interaction = interaction
    arg.interactable = interaction.interactable
    arg.element = interaction.element
    arg.rect = arg.rect || interaction.rect
    arg.edges = this.edges
    arg.startOffset = this.startOffset
  }

  startAll (arg: MethodArg & Partial<ModifierArg>) {
    this.fillArg(arg)

    for (const state of this.states) {
      if (state.methods.start) {
        arg.state = state
        state.methods.start(arg as ModifierArg)
      }
    }
  }

  setAll (arg: MethodArg & Partial<ModifierArg>): ModificationResult {
    this.fillArg(arg)

    const {
      phase,
      preEnd,
      skipModifiers,
      rect: unmodifiedRect,
    } = arg

    arg.coords = extend({}, arg.pageCoords)
    arg.rect = extend({}, unmodifiedRect)

    const states = skipModifiers
      ? this.states.slice(skipModifiers)
      : this.states

    const newResult = createResult(arg.coords, arg.rect)

    for (const state of states) {
      const { options } = state
      const lastModifierCoords = extend({}, arg.coords)
      let returnValue = null

      if (state.methods.set && this.shouldDo(options, preEnd, phase)) {
        arg.state = state
        returnValue = state.methods.set(arg as ModifierArg)

        rectUtils.addEdges(this.interaction.edges, arg.rect, { x: arg.coords.x - lastModifierCoords.x, y: arg.coords.y - lastModifierCoords.y })
      }

      newResult.eventProps.push(returnValue)
    }

    newResult.delta.x = arg.coords.x - arg.pageCoords.x
    newResult.delta.y = arg.coords.y - arg.pageCoords.y

    newResult.rectDelta.left   = arg.rect.left - unmodifiedRect.left
    newResult.rectDelta.right  = arg.rect.right - unmodifiedRect.right
    newResult.rectDelta.top    = arg.rect.top - unmodifiedRect.top
    newResult.rectDelta.bottom = arg.rect.bottom - unmodifiedRect.bottom

    const prevCoords = this.result.coords
    const prevRect = this.result.rect

    if (prevCoords && prevRect) {
      const rectChanged = newResult.rect.left !== prevRect.left ||
        newResult.rect.right !== prevRect.right ||
        newResult.rect.top !== prevRect.top ||
        newResult.rect.bottom !== prevRect.bottom

      newResult.changed = rectChanged ||
        prevCoords.x !== newResult.coords.x ||
        prevCoords.y !== newResult.coords.y
    }

    return newResult
  }

  applyToInteraction (arg: { phase: Interact.EventPhase, rect?: Interact.Rect }) {
    const { interaction } = this
    const { phase } = arg
    const curCoords = interaction.coords.cur
    const startCoords = interaction.coords.start
    const { result, startDelta } = this
    const curDelta = result.delta

    if (phase === 'start') {
      extend(this.startDelta, result.delta)
    }

    for (const [coordsSet, delta] of [[startCoords, startDelta], [curCoords, curDelta]] as const) {
      coordsSet.page.x   += delta.x
      coordsSet.page.y   += delta.y
      coordsSet.client.x += delta.x
      coordsSet.client.y += delta.y
    }

    const { rectDelta } = this.result
    const rect = arg.rect || interaction.rect

    rect.left   += rectDelta.left
    rect.right  += rectDelta.right
    rect.top    += rectDelta.top
    rect.bottom += rectDelta.bottom

    rect.width = rect.right - rect.left
    rect.height = rect.bottom - rect.top
  }

  setAndApply (arg: Partial<Interact.DoAnyPhaseArg> & {
    phase: Interact.EventPhase
    preEnd?: boolean
    skipModifiers?: number
    modifiedCoords?: Interact.Point
  }): void | false {
    const { interaction } = this
    const { phase, preEnd, skipModifiers } = arg

    const result = this.setAll({
      preEnd,
      phase,
      pageCoords: arg.modifiedCoords || interaction.coords.cur.page,
    })

    this.result = result

    // don't fire an action move if a modifier would keep the event in the same
    // cordinates as before
    if (!result.changed && (!skipModifiers || skipModifiers < this.states.length) && interaction.interacting()) {
      return false
    }

    if (arg.modifiedCoords) {
      const { page } = interaction.coords.cur
      const adjustment = {
        x: arg.modifiedCoords.x - page.x,
        y: arg.modifiedCoords.y - page.y,
      }

      result.coords.x += adjustment.x
      result.coords.y += adjustment.y
      result.delta.x += adjustment.x
      result.delta.y += adjustment.y
    }

    this.applyToInteraction(arg)
  }

  beforeEnd (arg: Omit<Interact.DoAnyPhaseArg, 'iEvent'> & { state?: ModifierState }): void | false {
    const { interaction, event } = arg
    const states = this.states

    if (!states || !states.length) {
      return
    }

    let doPreend = false

    for (const state of states) {
      arg.state = state
      const { options, methods } = state

      const endPosition = methods.beforeEnd && methods.beforeEnd(arg as unknown as ModifierArg)

      if (endPosition) {
        this.endResult = endPosition
        return false
      }

      doPreend = doPreend || (!doPreend && this.shouldDo(options, true, arg.phase, true))
    }

    if (doPreend) {
      // trigger a final modified move before ending
      interaction.move({ event, preEnd: true })
    }
  }

  stop (arg: { interaction: Interact.Interaction }) {
    const { interaction } = arg

    if (!this.states || !this.states.length) {
      return
    }

    const modifierArg: Partial<ModifierArg> = extend({
      states: this.states,
      interactable: interaction.interactable,
      element: interaction.element,
      rect: null,
    }, arg)

    this.fillArg(modifierArg)

    for (const state of this.states) {
      modifierArg.state = state

      if (state.methods.stop) { state.methods.stop(modifierArg as ModifierArg) }
    }

    this.states = null
    this.endResult = null
  }

  prepareStates (modifierList: Modifier[]) {
    this.states = []

    for (let index = 0; index < modifierList.length; index++) {
      const { options, methods, name } = modifierList[index]

      if (options && options.enabled === false) { continue }

      this.states.push({
        options,
        methods,
        index,
        name,
      })
    }

    return this.states
  }

  restoreInteractionCoords ({ interaction: { coords, rect, modification } }: { interaction: Interact.Interaction }) {
    if (!modification.result) { return }

    const { startDelta } = modification
    const { delta: curDelta, rectDelta } = modification.result

    const coordsAndDeltas = [
      [coords.start, startDelta],
      [coords.cur, curDelta],
    ]

    for (const [coordsSet, delta] of coordsAndDeltas as any) {
      coordsSet.page.x -= delta.x
      coordsSet.page.y -= delta.y
      coordsSet.client.x -= delta.x
      coordsSet.client.y -= delta.y
    }

    rect.left -= rectDelta.left
    rect.right -= rectDelta.right
    rect.top -= rectDelta.top
    rect.bottom -= rectDelta.bottom
  }

  shouldDo (options, preEnd?: boolean, phase?: string, requireEndOnly?: boolean) {
    if (
      // ignore disabled modifiers
      (!options || options.enabled === false) ||
      // check if we require endOnly option to fire move before end
      (requireEndOnly && !options.endOnly) ||
      // don't apply endOnly modifiers when not ending
      (options.endOnly && !preEnd) ||
      // check if modifier should run be applied on start
      (phase === 'start' && !options.setStart)
    ) {
      return false
    }

    return true
  }

  copyFrom (other: Modification) {
    this.startOffset = other.startOffset
    this.startDelta = other.startDelta
    this.edges = other.edges
    this.states = other.states.map(s => clone(s) as ModifierState)
    this.result = createResult(extend({}, other.result.coords), extend({}, other.result.rect))
  }

  destroy () {
    for (const prop in this) {
      this[prop] = null
    }
  }
}

function createResult (coords?: Interact.Point, rect?: Interact.FullRect): ModificationResult {
  return {
    rect,
    coords,
    delta: { x: 0, y: 0 },
    rectDelta: {
      left  : 0,
      right : 0,
      top   : 0,
      bottom: 0,
    },
    eventProps: [],
    changed: true,
  }
}

function getModifierList (interaction) {
  const actionOptions = interaction.interactable.options[interaction.prepared.name]
  const actionModifiers = actionOptions.modifiers

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers.filter(
      modifier => !modifier.options || modifier.options.enabled !== false,
    )
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize']
    .map(type => {
      const options = actionOptions[type]

      return options && options.enabled && {
        options,
        methods: options._methods,
      }
    })
    .filter(m => !!m)
}

export function getRectOffset (rect, coords) {
  return rect
    ? {
      left  : coords.x - rect.left,
      top   : coords.y - rect.top,
      right : rect.right  - coords.x,
      bottom: rect.bottom - coords.y,
    }
    : {
      left  : 0,
      top   : 0,
      right : 0,
      bottom: 0,
    }
}
