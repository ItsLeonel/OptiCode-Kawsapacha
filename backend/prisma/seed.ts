import process from 'node:process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATALOG = [
  {
    name: 'Romero',
    latinName: 'Salvia rosmarinus',
    icon: '🌿',
    description: 'Arbusto aromático mediterráneo ampliamente cultivado en Ecuador por sus propiedades culinarias y medicinales.',
    medicinalProperties: 'Tradicionalmente usado para mejorar la circulación, aliviar cefaleas y como tónico estimulante. Rico en antioxidantes.',
    preparation: 'Infusión: 1 cucharadita de hojas secas en agua caliente por 10 minutos. No hervir. 1 a 2 tazas diarias.',
    contraindications: 'Evitar en dosis altas durante el embarazo. No usar en niños menores de 6 años sin supervisión médica.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 4,
    fertilizerFrequencyDays: 30,
    growthCycleDays: 60,
    bestPlantingSeason: 'Todo el año (preferible época seca)',
    lunarPhaseTip: 'Sembrar en cuarto creciente para mayor desarrollo de hojas aromáticas',
  },
  {
    name: 'Manzanilla',
    latinName: 'Matricaria chamomilla',
    icon: '🌼',
    description: 'Planta herbácea anual con flores aromáticas blancas y amarillas. Muy usada en la medicina tradicional andina.',
    medicinalProperties: 'Propiedades calmantes, antiespasmódicas y antiinflamatorias. Alivia molestias digestivas y favorece el sueño.',
    preparation: 'Infusión: 2 cucharadas de flores en agua caliente por 5 minutos. 2 a 3 tazas diarias después de las comidas.',
    contraindications: 'Puede causar reacciones alérgicas en personas sensibles a las Asteráceas. Consultar ante alergias conocidas.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 3,
    fertilizerFrequencyDays: 21,
    growthCycleDays: 45,
    bestPlantingSeason: 'Agosto a diciembre',
    lunarPhaseTip: 'Sembrar en luna nueva para favorecer el desarrollo de flores',
  },
  {
    name: 'Menta',
    latinName: 'Mentha sp.',
    icon: '🌱',
    description: 'Hierba perenne de aroma intenso y refrescante. Se adapta fácilmente a distintos climas ecuatorianos.',
    medicinalProperties: 'Alivia náuseas, cefaleas leves y molestias digestivas. Propiedades antiespasmódicas y refrescantes.',
    preparation: 'Infusión: hojas frescas o secas en agua caliente por 5 a 7 minutos. Se puede combinar con manzanilla.',
    contraindications: 'El aceite esencial no debe aplicarse directamente en niños pequeños. Moderar el consumo en personas con reflujo.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 2,
    fertilizerFrequencyDays: 21,
    growthCycleDays: 30,
    bestPlantingSeason: 'Todo el año',
    lunarPhaseTip: 'Trasplantar en cuarto menguante para fortalecer raíces',
  },
  {
    name: 'Toronjil',
    latinName: 'Melissa officinalis',
    icon: '🍃',
    description: 'Planta herbácea perenne de la familia de las lamiáceas. Muy apreciada en las comunidades andinas del Ecuador.',
    medicinalProperties: 'Calma los nervios, alivia la ansiedad leve, ayuda contra el insomnio y mejora el ánimo.',
    preparation: 'Infusión: 1 a 2 cucharadas de hojas frescas o secas en agua caliente por 10 minutos. 2 tazas diarias.',
    contraindications: 'Puede interactuar con sedantes. Consultar con un profesional de salud si se toman medicamentos.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 3,
    fertilizerFrequencyDays: 25,
    growthCycleDays: 50,
    bestPlantingSeason: 'Octubre a febrero',
    lunarPhaseTip: 'Sembrar en cuarto creciente para maximizar aceites esenciales',
  },
  {
    name: 'Hierbabuena',
    latinName: 'Mentha spicata',
    icon: '🌿',
    description: 'Variedad de menta de sabor más suave. Cultivada en huertos ecuatorianos para usos culinarios y medicinales.',
    medicinalProperties: 'Favorece la digestión, alivia flatulencias y náuseas. Propiedades refrescantes y antimicrobianas suaves.',
    preparation: 'Infusión: hojas frescas en agua caliente por 5 minutos. También puede añadirse a ensaladas y aguas aromáticas.',
    contraindications: 'Generalmente segura en cantidades alimentarias. Evitar el aceite esencial concentrado en niños.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 2,
    fertilizerFrequencyDays: 21,
    growthCycleDays: 35,
    bestPlantingSeason: 'Todo el año',
    lunarPhaseTip: 'Podar en luna menguante para renovar vigorosamente el follaje',
  },
  {
    name: 'Lavanda',
    latinName: 'Lavandula sp.',
    icon: '💜',
    description: 'Arbusto aromático de flores violetas. Se cultiva en zonas altas del Ecuador por su fragancia y propiedades medicinales.',
    medicinalProperties: 'Propiedades relajantes y ansiolíticas. Usada para aliviar el estrés, migrañas leves e insomnio.',
    preparation: 'Infusión suave de flores secas. También se utiliza en aromaterapia y como repelente natural de insectos.',
    contraindications: 'El aceite esencial puede causar irritación cutánea en personas sensibles. No ingerir aceite esencial puro.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 7,
    fertilizerFrequencyDays: 45,
    growthCycleDays: 90,
    bestPlantingSeason: 'Marzo a junio (zona alta)',
    lunarPhaseTip: 'Sembrar en luna llena para potenciar fragancia floral',
  },
  {
    name: 'Orégano',
    latinName: 'Origanum vulgare',
    icon: '🌱',
    description: 'Hierba aromática mediterránea adaptada a Ecuador. Usada principalmente como condimento y por sus propiedades antimicrobianas.',
    medicinalProperties: 'Propiedades antimicrobianas, antifúngicas y antioxidantes. Alivia afecciones respiratorias leves.',
    preparation: 'Infusión para afecciones respiratorias: 1 cucharadita de hojas en agua caliente. También en cocina como condimento.',
    contraindications: 'Evitar dosis medicinales altas durante el embarazo. Las cantidades culinarias son generalmente seguras.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 5,
    fertilizerFrequencyDays: 30,
    growthCycleDays: 55,
    bestPlantingSeason: 'Septiembre a enero',
    lunarPhaseTip: 'Cosechar hojas en luna menguante para mayor concentración de aceites',
  },
  {
    name: 'Llantén',
    latinName: 'Plantago major',
    icon: '🌾',
    description: 'Planta herbácea medicinal presente en zonas rurales y urbanas de todo Ecuador. Planta ancestral en la medicina andina.',
    medicinalProperties: 'Propiedades antiinflamatorias, cicatrizantes y expectorantes. Usada para afecciones respiratorias y de la piel.',
    preparation: 'Infusión de hojas para afecciones respiratorias. Cataplasma de hojas frescas para heridas e irritaciones cutáneas.',
    contraindications: 'Generalmente bien tolerado. Consultar ante alergias a Plantago. No reemplaza tratamiento médico en infecciones.',
    defaultPhotoUrl: '',
    wateringFrequencyDays: 3,
    fertilizerFrequencyDays: 20,
    growthCycleDays: 40,
    bestPlantingSeason: 'Todo el año',
    lunarPhaseTip: 'Recolectar hojas en luna llena para mayor potencia medicinal',
  },
]

async function main() {
  console.log('🌱 Iniciando seed del catálogo medicinal...')

  for (const plant of CATALOG) {
    await prisma.medicinalCatalog.upsert({
      where: { id: plant.name },
      update: plant,
      create: { id: plant.name, ...plant },
    })
    console.log(`   ✓ ${plant.name} (${plant.latinName})`)
  }

  console.log(`\n✅ Seed completado. ${CATALOG.length} especies en el catálogo.\n`)
}

main()
  .catch(e => { console.error('Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
