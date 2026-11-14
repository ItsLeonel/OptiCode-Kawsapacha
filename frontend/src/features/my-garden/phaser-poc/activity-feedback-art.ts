import type Phaser from 'phaser'
import type { ActivityType } from '../journal/activities'

export type IllustratedActivity = Extract<ActivityType, 'watering' | 'fertilizing' | 'weeding' | 'harvest'>

export function hasIllustratedFeedback(type: ActivityType): type is IllustratedActivity {
  return type === 'watering' || type === 'fertilizing' || type === 'weeding' || type === 'harvest'
}

/**
 * Eventos EFÍMEROS que indican una actividad guardada; no certifican estado
 * del suelo, crecimiento, cosecha en kg ni cantidad de fertilizante.
 */
export function paintActivityFeedback(g: Phaser.GameObjects.Graphics, activity: IllustratedActivity, index = 0) {
  if (activity === 'watering') {
    // Gotas azuladas con un reflejo, sin alterar la ilustración permanente.
    g.fillStyle(0x69d0e9, .98)
    g.fillTriangle(-6, 2, 0, -13, 6, 2)
    g.fillEllipse(0, 4, 12, 13)
    g.fillStyle(0xe3faff, .85).fillEllipse(-2.7, -1, 2.4, 5)
    return
  }
  if (activity === 'fertilizing') {
    // Gránulos/compost flotan brevemente hasta la superficie.
    g.fillStyle(0x8c6337, 1).fillEllipse(0, 2, 14, 9)
    g.fillStyle(0xc8a866, 1).fillCircle(-4, -1, 2.3)
    g.fillStyle(0x6f9c45, 1).fillEllipse(4, -3, 7, 4)
    g.lineStyle(1.5, 0xe8cd8d, .96).lineBetween(-6, 4, 6, 4)
    return
  }
  if (activity === 'weeding') {
    // Unas hierbas se retiran visualmente; NO se borran cultivos ni se mutan datos.
    const lean = index % 2 ? -1 : 1
    g.lineStyle(3.2, 0x3a8444, .96).lineBetween(0, 13, lean * 2, -12)
    g.lineStyle(2, 0x6bad58, 1).lineBetween(0, 2, lean * 10, -6)
    g.lineBetween(0, -4, -lean * 10, -13)
    g.fillStyle(0xa17b50, .96).fillEllipse(0, 13, 9, 4)
    return
  }
  // Cosecha: canasto simbólico vacío (no se inventan frutos, cantidades o éxito).
  g.lineStyle(3, 0xb77d42, .95)
  g.strokeEllipse(0, -1, 45, 21)
  g.fillStyle(0xb98a50, .95).fillTriangle(-22, 1, 22, 1, 16, 23)
  g.fillTriangle(-22, 1, 16, 23, -16, 23)
  g.lineStyle(2, 0xffe2a2, .95)
  for (const x of [-12, -3, 6, 15]) g.lineBetween(x, 5, x * .65, 21)
  g.lineBetween(-17, 12, 17, 12)
  g.lineStyle(3.2, 0x785834, 1).strokeEllipse(0, -12, 30, 37)
}

/** Movimiento acotado, nunca animación permanente ni reloj de crecimiento. */
export function feedbackMotion(activity: IllustratedActivity, index: number) {
  if (activity === 'watering') return { fromY: -75 - index * 4, toY: -9, duration: 580 + (index % 3) * 55, delay: index * 43, count: 8 }
  if (activity === 'fertilizing') return { fromY: -48 - index * 4, toY: 4, duration: 680 + index * 35, delay: index * 78, count: 5 }
  if (activity === 'weeding') return { fromY: 0, toY: -58, duration: 730, delay: index * 90, count: 3 }
  return { fromY: -18, toY: -53, duration: 940, delay: 0, count: 1 }
}
