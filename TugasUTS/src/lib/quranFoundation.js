const defaultBaseUrl = 'https://apis.quran.foundation/content/api/v4'

export function getQfConfig(){
  const baseUrl = (import.meta.env.VITE_QF_BASE_URL || defaultBaseUrl).replace(/\/+$/,'')
  const clientId = import.meta.env.VITE_QF_CLIENT_ID
  const authToken = import.meta.env.VITE_QF_AUTH_TOKEN
  return { baseUrl, clientId, authToken }
}

export function hasQfCreds(){
  const { clientId, authToken } = getQfConfig()
  return Boolean(clientId && authToken)
}

async function qfFetch(path){
  const { baseUrl, clientId, authToken } = getQfConfig()
  if (!clientId || !authToken) throw new Error('Missing Quran Foundation credentials')
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      'x-client-id': clientId,
      'x-auth-token': authToken,
    },
  })
  if (!res.ok) throw new Error(`QF ${res.status}`)
  return res.json()
}

export async function listRukus(){
  const json = await qfFetch('/rukus')
  return json?.rukus || json?.ruku || json
}

export async function getRuku(id){
  const json = await qfFetch(`/rukus/${id}`)
  return json?.ruku || json
}

export async function listHizbs(){
  const json = await qfFetch('/hizbs')
  return json?.hizbs || json?.hizb || json
}

export async function getHizb(id){
  const json = await qfFetch(`/hizbs/${id}`)
  return json?.hizb || json
}

