function isMokupScriptUrl(url: string) {
  try {
    return new URL(url).pathname.includes('mokup-sw')
  }
  catch {
    return url.includes('mokup-sw')
  }
}

function isMokupRegistration(registration: ServiceWorkerRegistration) {
  const scriptUrls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter((entry): entry is string => typeof entry === 'string')
  return scriptUrls.some(url => isMokupScriptUrl(url))
}

function isMokupController(controller: ServiceWorker | null | undefined) {
  return !!controller && isMokupScriptUrl(controller.scriptURL)
}

async function resolveMokupRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && isMokupRegistration(registration)) {
      return registration
    }
  }
  catch {
    // Ignore lookup errors.
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    return registrations.find(isMokupRegistration) ?? null
  }
  catch {
    return null
  }
}

export { isMokupController, resolveMokupRegistration }
