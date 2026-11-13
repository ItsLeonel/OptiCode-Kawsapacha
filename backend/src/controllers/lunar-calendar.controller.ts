// backend/src/controllers/lunar-calendar.controller.ts
import type { Request, Response } from 'express'
import { ok, fail } from '../utils/response'
import {
  calculateDayLunarInfo,
  calculateMonthLunarInfo,
} from '../services/lunar-calendar.service'

export async function getLunarCalendar(req: Request, res: Response): Promise<void> {
  try {
    const { date, month, timezone } = req.query as {
      date?: string
      month?: string
      timezone?: string
    }

    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        fail(res, 'INVALID_MONTH_FORMAT', 'El parámetro "month" debe tener formato YYYY-MM.', 400)
        return
      }
      const data = calculateMonthLunarInfo(month, timezone)
      ok(res, data, `Calendario lunar para el mes ${month}`)
      return
    }

    // Si se pasa date o se toma la fecha actual
    let targetDate = date
    if (!targetDate) {
      // Fecha actual en hora local de Ecuador (UTC-5)
      const now = new Date()
      const ecuadorOffsetMs = -5 * 60 * 60 * 1000
      const localDate = new Date(now.getTime() + ecuadorOffsetMs)
      targetDate = localDate.toISOString().slice(0, 10)
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      fail(res, 'INVALID_DATE_FORMAT', 'El parámetro "date" debe tener formato YYYY-MM-DD.', 400)
      return
    }

    const data = calculateDayLunarInfo(targetDate, timezone)
    ok(res, data, `Fase lunar para ${targetDate}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al calcular la fase lunar.'
    fail(res, 'LUNAR_CALC_ERROR', message, 400)
  }
}

