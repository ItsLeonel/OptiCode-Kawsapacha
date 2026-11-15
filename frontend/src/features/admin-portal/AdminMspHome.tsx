import { useState } from 'react'
import AdminIcon, { type AdminIconName } from './AdminIcon'
import AdminMap from './AdminMap'
import type { AdminNavKey, MspDashboardData } from './admin-types'
import communityLearning from '../communities/assets/aprender-v2.jpg'
import communityEvents from '../communities/assets/eventos-v2.jpg'
import { FormattedCount, AdminMetric, AdminPanel, ActionLink, EmptyState, ValueBadge } from './admin-ui'

export function MspHome({ data, setTab }: { data?: MspDashboardData; setTab: (next: AdminNavKey) => void }) {
  const [province, setProvince] = useState('')
  return <>
    <div className="kap-section-heading"><div><h2>Panel de gestión institucional</h2><p>Supervisión y acompañamiento de Kawsapacha · simulación académica, no un portal oficial del MSP</p></div><span className="kap-info-chip"><AdminIcon name="shield" size={14}/> Datos del proyecto</span></div>
    <div className="kap-metrics">
      <AdminMetric icon="users" label="Comunidades registradas" value={data?.communitiesTotal}/>
      <AdminMetric icon="calendar" label="Eventos registrados" value={data?.activeEvents} tone="gold"/>
      <AdminMetric icon="book" label="Recursos educativos" value={data?.educationalResources} tone="brown"/>
      <AdminMetric icon="shield" label="Contenidos en moderación" value={data?.moderationPending} tone="red"/>
    </div>
    <div className="kap-msp-primary-grid">
      <AdminPanel icon="pin" title="Cobertura de comunidades" subtitle="Distribución de comunidades en el territorio nacional" action={<ActionLink onClick={() => setTab('comunidades')}>Ver cobertura territorial</ActionLink>}>
        <div className="kap-map-panel">
          <AdminMap province={province} onProvinceChange={setProvince} communities={data?.communities ?? []}/>
          <div className="kap-map-aside"><div className="kap-tally"><AdminIcon name="users" size={20}/><span><strong><FormattedCount value={data?.communitiesTotal}/></strong><small>Comunidades</small></span></div>
            <div className="kap-tally"><AdminIcon name="shield" size={20}/><span><strong><FormattedCount value={data?.communitiesApproved}/></strong><small>Verificadas</small></span></div>
            <div className="kap-tally"><AdminIcon name="map" size={20}/><span><strong>24</strong><small>Provincias del Ecuador</small></span></div></div>
        </div>
      </AdminPanel>
      <AdminPanel icon="calendar" title="Próximos eventos institucionales" subtitle="Ferias, mingas y actividades de alcance nacional" action={<ActionLink onClick={() => setTab('eventos')}>Ver todos</ActionLink>}>
        {data?.events?.length ? <div className="kap-list-rows">{data.events.slice(0, 3).map(event => <div className="kap-row" key={event.id}>
          <span className="kap-row-icon"><AdminIcon name="calendar" size={20}/></span><div><strong>{event.name}</strong><small>{event.date} · {event.province}</small></div><ValueBadge>{event.scope}</ValueBadge></div>)}</div> :
          <EmptyState title="Sin eventos institucionales publicados" detail="Aquí aparecerán los eventos reales creados por el MSP cuando esté conectada su API." illustration={communityEvents}/>}
      </AdminPanel>
    </div>
    <div className="kap-msp-secondary-grid">
      <AdminPanel icon="book" title="Recursos educativos destacados" subtitle="Guías, materiales y saberes publicados" action={<ActionLink onClick={() => setTab('recursos')}>Ver biblioteca</ActionLink>}>
        {data?.resources?.length ? <div className="kap-resource-list">{data.resources.filter(r => r.published).slice(0, 3).map(resource => <div className="kap-resource-tile" key={resource.id}><AdminIcon name="book" size={25}/><strong>{resource.title}</strong><small>{resource.kind}</small></div>)}</div> :
          <EmptyState title="Biblioteca pendiente de contenido" detail="Las publicaciones verificadas aparecerán aquí." illustration={communityLearning}/>}
      </AdminPanel>
      <AdminPanel icon="shield" title="Contenidos por moderar" subtitle="Publicaciones y evidencias de revisión" action={<ActionLink onClick={() => setTab('moderacion')}>Revisar</ActionLink>}>
        <div className="kap-review-list">
          {([['Comunidades','users'], ['Actividades y evidencias','image']] as [string, AdminIconName][]).map(([label, icon]) => <button type="button" key={label} onClick={() => setTab('moderacion')}><AdminIcon name={icon} size={18}/><span>{label}</span><span className="kap-review-pending">{label === 'Comunidades' ? `${(data?.communities ?? []).filter(c => c.state === 'PENDING' || c.state === 'NEEDS_CHANGES').length} por revisar` : `${(data?.activities ?? []).filter(a => a.reviewStatus === 'PENDING' || a.reviewStatus === 'NEEDS_CHANGES').length} por revisar`}</span></button>)}
        </div>
      </AdminPanel>
      <AdminPanel icon="chart" title="Reportes rápidos" subtitle="Indicadores del programa" action={<ActionLink onClick={() => setTab('reportes')}>Ver reportes</ActionLink>}>
        <div className="kap-report-list">{['Actividades agrícolas', 'Eventos por provincia', 'Recursos por categoría'].map(label => <button type="button" key={label} onClick={() => setTab('reportes')}><AdminIcon name="chart" size={18}/>{label}<AdminIcon name="right" size={17}/></button>)}</div>
      </AdminPanel>
    </div>
  </>
}
