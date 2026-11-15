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

/**
 * Señales temporales para las otras actividades registradas. Ilustran la
 * acción, sin recrear una planta, cosecha inexistente o un ritual cultural.
 */
export function paintSecondaryFeedback(g: Phaser.GameObjects.Graphics, type: ActivityType) {
  if (type === 'preparation' || type === 'hilling') {
    g.lineStyle(4, 0xa16e42, .96)
    for (let i = -1; i <= 1; i++) g.strokeEllipse(i * 23, 0, type === 'hilling' ? 26 : 39, type === 'hilling' ? 19 : 12)
  } else if (type === 'sowing' || type === 'replanting') {
    g.fillStyle(0x987044, .98)
    for (let i = -1; i <= 1; i++) g.fillEllipse(i * 17, (i % 2) * 8, 8, 12)
    if (type === 'replanting') {
      g.lineStyle(4, 0xffe0a1, .96).lineBetween(-28, 25, 25, -15)
      g.lineBetween(25, -15, 11, -14).lineBetween(25, -15, 22, 0)
    }
  } else if (type === 'observation') {
    g.lineStyle(5, 0xffe6b7, .98).strokeCircle(-6, -6, 18)
    g.lineStyle(6, 0x875d39, .98).lineBetween(7, 7, 33, 34)
    g.fillStyle(0xd5f0f0, .18).fillCircle(-6, -6, 15)
  } else if (type === 'signage') {
    g.fillStyle(0x946139, .98).fillRoundedRect(-30, -29, 60, 34, 6)
    g.fillStyle(0xffdf9c, .9).fillRoundedRect(-22, -24, 44, 24, 3)
    g.lineStyle(7, 0x6c4b30).lineBetween(0, 6, 0, 39)
  } else if (type === 'postharvest') {
    g.fillStyle(0xd0a469, .9).fillRoundedRect(-28, -18, 56, 40, 5)
    g.lineStyle(3, 0x79543a).strokeRoundedRect(-28, -18, 56, 40, 5)
    g.lineBetween(-18, -18, 18, 22).lineBetween(18, -18, -18, 22)
  } else if (type === 'sowing_ritual' || type === 'gratitude_ritual') {
    // Un destello neutro indica que se documentó una actividad cultural.
    g.fillStyle(0xecc57b, .93).fillCircle(0, 0, 8)
    g.lineStyle(3, 0xf9e1aa, .95)
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4
      g.lineBetween(Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * 29, Math.sin(a) * 29)
    }
  }
}
