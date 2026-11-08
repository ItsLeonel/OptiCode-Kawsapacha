import type { GardenVisualModel, SlotId } from './model'
import type { ActivityType } from '../journal/activities'

export type SceneSnapshot = { model: GardenVisualModel; selected: SlotId | null; blocked: boolean }
export type CameraState = { zoom: number; left: number; top: number }
export type SceneCommand =
  | { type: 'snapshot'; snapshot: SceneSnapshot }
  | { type: 'zoom'; factor: number }
  | { type: 'pan'; x: number; y: number }
  | { type: 'reset-camera' }
  | { type: 'focus-slot'; slot: SlotId }
  | { type: 'clear-focus' }
  | { type: 'feedback'; id: string; activity: ActivityType; plot: number | null; reducedMotion: boolean }
export type SceneEvent =
  | { type: 'activate-slot'; slot: SlotId }
  | { type: 'hover-slot'; slot: SlotId | null }
  | { type: 'camera'; camera: CameraState }
  | { type: 'ready'; renderer: 'WebGL' | 'Canvas' }
  | { type: 'asset-error'; asset: string }
  | { type: 'rendered'; components: string[] }

/** One bus per mounted garden; nothing is shared globally between React roots. */
export class GardenSceneBridge {
  private commands = new Set<(command: SceneCommand) => void>()
  private events = new Set<(event: SceneEvent) => void>()
  constructor(public snapshot: SceneSnapshot) {}
  command(command: SceneCommand) {
    if (command.type === 'snapshot') this.snapshot = command.snapshot
    this.commands.forEach(listener => listener(command))
  }
  emit(event: SceneEvent) {
    if (event.type === 'activate-slot' && this.snapshot.blocked) return
    this.events.forEach(listener => listener(event))
  }
  onCommand(listener: (command: SceneCommand) => void) {
    this.commands.add(listener)
    return () => { this.commands.delete(listener) }
  }
  onEvent(listener: (event: SceneEvent) => void) {
    this.events.add(listener)
    return () => { this.events.delete(listener) }
  }
}
