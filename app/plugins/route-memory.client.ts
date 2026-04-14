const LAST_ROUTE_STORAGE_KEY = 'last-app-route'

function isAppAreaPath(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/worker')
}

export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.afterEach((to) => {
    if (!import.meta.client) {
      return
    }

    if (isAppAreaPath(to.path)) {
      localStorage.setItem(LAST_ROUTE_STORAGE_KEY, to.fullPath)
    }
  })
})
