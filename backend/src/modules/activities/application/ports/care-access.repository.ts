/** Puerto de lectura de parcela para autorizar cuidados sin depender del ORM. */
export interface CareAccessRepository {
  findGardenIdByPlant(plantId: string): Promise<string | null>
}
