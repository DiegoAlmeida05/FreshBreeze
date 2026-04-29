/**
 * Plugin que gerencia eventos de visibilidade (app indo para background/foreground)
 * Ajuda a sincronizar estado quando a app volta do background
 */

export default defineNuxtPlugin(() => {
  if (!process.client) return

  // Escuta quando a página fica visível novamente
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // App foi para background - pode sincronizar estado aqui se necessário
      console.debug('[App] Moved to background')
    }
    else {
      // App voltou para foreground
      console.debug('[App] Returned from background')
      
      // Força uma leve atualização de componentes ao voltar
      // Isso pode ser usado para refrescar dados se necessário
      window.dispatchEvent(new CustomEvent('app:foreground'))
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Cleanup
  return {
    provide: {
      appVisibility: {
        isVisible: () => !document.hidden,
      },
    },
  }
})
