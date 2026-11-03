export type Community = {
  name: string
  responsible: string
  location: string
  description: string
}

export type CommunitySpace = 'wisdom' | 'experience' | 'practice' | 'conversations' | 'news' | 'communities' | 'garden' | 'activities'

export const COMMUNITY_SPACES: Record<CommunitySpace, { title: string; description: string; empty: string; pending?: string }> = {
  wisdom: { title: 'Aprender juntos', description: 'Un espacio para consultar saberes ancestrales, guías y contenido educativo.', empty: 'Aún no hay saberes ni contenido educativo publicados.' },
  experience: { title: 'Publicar mi experiencia', description: 'Compartir fotografías y experiencias de cultivo es una forma de aprender juntos.', empty: 'La publicación de experiencias está pendiente.', pending: 'El formulario para publicar y la carga de fotografías aún no están implementados. No se enviará ni guardará contenido desde esta sección.' },
  practice: { title: 'Prácticas de cultivo', description: 'Un lugar para compartir el cuidado de las plantas y los aprendizajes del huerto.', empty: 'Aún no hay prácticas de cultivo publicadas.' },
  conversations: { title: 'Foro comunitario', description: 'Un lugar para conversar, hacer preguntas e intercambiar aprendizajes entre integrantes.', empty: 'El foro y las conversaciones están pendientes.', pending: 'El foro de preguntas y conversaciones aún no está implementado. Todavía no es posible crear temas, responder ni conversar con integrantes.' },
  news: { title: 'Novedades de la comunidad', description: 'Aquí encontrarás las nuevas historias y los anuncios de tu comunidad.', empty: 'Aún no hay novedades publicadas.' },
  communities: { title: 'Nuestras comunidades', description: 'Personas que se encuentran para cuidar la tierra y aprender juntas.', empty: 'Aún no has creado una comunidad en esta visita.' },
  garden: { title: 'Huertos compartidos', description: 'Un espacio para cultivar y aprender en comunidad.', empty: 'Tu comunidad aún no tiene un huerto registrado.' },
  activities: { title: 'Actividades de la comunidad', description: 'Talleres, mingas y encuentros para crecer juntos.', empty: 'Aún no hay actividades programadas.' },
}
