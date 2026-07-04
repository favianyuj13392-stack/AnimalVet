import type { Metadata } from 'next'
import FichaEmergenciaCliente from './ficha-emergencia'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/huellitas'
const SITE_URL = 'https://huellitas-digitales.net'

interface Props {
  params: Promise<{ hash_qr: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash_qr } = await params

  try {
    const res  = await fetch(`${API_BASE}/publico/mascotas/perfil/${hash_qr}`, { cache: 'no-store' })
    const data = await res.json()

    if (!data || data.statusCode) throw new Error('not found')

    const titulo    = data.estado_perdido
      ? `🚨 ¡Ayuda a encontrar a ${data.nombre}! — Huellitas Digitales`
      : `🐾 ${data.nombre} — Ficha Médica QR | Huellitas Digitales`

    const descripcion = data.estado_perdido
      ? `${data.nombre} está extraviado/a. ${data.especie} ${data.raza}${data.caracteristicas_fisicas ? ` · ${data.caracteristicas_fisicas}` : ''}. Si lo/la ves, por favor contacta al dueño.`
      : `Ficha médica de ${data.nombre}. ${data.especie} ${data.raza} · ${data.sexo}. Sistema QR de Huellitas Digitales.`

    const imagen = data.foto_url ?? `${SITE_URL}/og-default.png`
    const url    = `${SITE_URL}/emergencia/${hash_qr}`

    return {
      title: titulo,
      description: descripcion,
      openGraph: {
        title:       titulo,
        description: descripcion,
        url,
        siteName:    'Huellitas Digitales',
        images: [
          {
            url:    imagen,
            width:  800,
            height: 600,
            alt:    `Foto de ${data.nombre}`,
          },
        ],
        locale: 'es_BO',
        type:   'website',
      },
      twitter: {
        card:        'summary_large_image',
        title:       titulo,
        description: descripcion,
        images:      [imagen],
      },
    }
  } catch {
    return {
      title:       '🐾 Ficha de Emergencia — Huellitas Digitales',
      description: 'Sistema de placas QR para mascotas. Escanea para ver datos médicos de emergencia.',
      openGraph: {
        title:       '🐾 Ficha de Emergencia — Huellitas Digitales',
        description: 'Sistema de placas QR para mascotas.',
        images:      [{ url: `${SITE_URL}/og-default.png` }],
      },
    }
  }
}

export default function Page() {
  return <FichaEmergenciaCliente />
}
