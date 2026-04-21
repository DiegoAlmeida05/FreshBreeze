<template>
  <div class="space-y-3">
    <div class="rounded-xl border border-border bg-surface/80 p-3 dark:bg-white/[0.03]">
      <canvas
        ref="canvasRef"
        class="h-36 w-full cursor-crosshair touch-none rounded-lg border border-dashed border-primary-200 bg-white dark:border-white/15 dark:bg-black/20"
        @pointerdown="startDrawing"
        @pointermove="draw"
        @pointerup="stopDrawing"
        @pointerleave="stopDrawing"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="clearSignature">Clear</button>
      <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" @click="saveSignature">Use drawn signature</button>

      <input
        id="worker-signature-upload"
        ref="uploadInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="hidden"
        @change="onUpload"
      >
      <button type="button" class="btn-outline !px-3 !py-1.5 text-xs" @click="triggerUpload">
        Upload image
      </button>
    </div>

    <p v-if="errorMessage" class="text-xs text-error-600">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
  'signature-change': [dataUrl: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const uploadInput = ref<HTMLInputElement | null>(null)
const isDrawing = ref(false)
const errorMessage = ref('')

function getCanvasContext(): CanvasRenderingContext2D | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const context = canvas.getContext('2d')
  if (!context) return null

  return context
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  const context = getCanvasContext()

  if (!canvas || !context) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (canvas.width === width && canvas.height === height) return

  const previous = canvas.toDataURL('image/png')

  canvas.width = width
  canvas.height = height

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.strokeStyle = '#111827'
  context.lineWidth = 2
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (previous && previous !== 'data:,') {
    const image = new Image()
    image.onload = () => {
      context.drawImage(image, 0, 0, width, height)
    }
    image.src = previous
  }
}

function getPoint(event: PointerEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startDrawing(event: PointerEvent): void {
  const context = getCanvasContext()
  const point = getPoint(event)

  if (!context || !point) return

  isDrawing.value = true
  context.beginPath()
  context.moveTo(point.x, point.y)
}

function draw(event: PointerEvent): void {
  if (!isDrawing.value) return

  const context = getCanvasContext()
  const point = getPoint(event)

  if (!context || !point) return

  context.lineTo(point.x, point.y)
  context.stroke()
}

function stopDrawing(): void {
  isDrawing.value = false
}

function clearSignature(): void {
  const context = getCanvasContext()
  const canvas = canvasRef.value

  if (!context || !canvas) return

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
}

function saveSignature(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  emit('signature-change', canvas.toDataURL('image/png'))
}

function triggerUpload(): void {
  uploadInput.value?.click()
}

function onUpload(event: Event): void {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]

  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'File too large. Maximum is 5MB.'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : ''
    if (!result) return

    errorMessage.value = ''
    emit('signature-change', result)
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})
</script>
