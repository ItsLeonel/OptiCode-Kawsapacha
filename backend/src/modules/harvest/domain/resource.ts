/** Datos editables de un recurso comunitario; sin tipos del ORM. */
export interface ResourceInput {
  name: string
  category: string
  quantity: number
  unit: string
  status: string
  description: string
}
