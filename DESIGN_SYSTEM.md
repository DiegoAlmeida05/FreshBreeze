# Design System — FreshBreeze RouteOps

## 🎨 Esquema de Cores

Extraído dos logotipos da marca FreshBreeze BnB Services.

### Cores Primárias

| Token | Hex | RGB | Modo | Uso |
|-------|-----|-----|------|-----|
| **brand** | `#FF6600` | `255 102 0` | Light & Dark | Call-to-action principal, destaques |
| **secondary** | `#0077E6` | `0 119 230` | Light & Dark | Ações secundárias, informações |
| **accent** | `#E31837` | `227 24 55` | Light & Dark | Ênfase, alertas, status crítico |

### Cores Semânticas (Modo Claro)

| Token | Cor | Hex | Uso |
|-------|-----|-----|-----|
| `surface` | Branco | `#FFFFFF` | Fundo principal da página |
| `surface-soft` | Cinza muito claro | `#F8F9FA` | Fundo subtil, cards alternados |
| `border` | Cinza claro | `#E2E8F0` | Divisores, bordas |
| `foreground` | Azul escuro | `#0F172A` | Texto principal |
| `muted` | Cinza médio | `#64748B` | Texto secundário |

### Cores Semânticas (Modo Escuro)

| Token | Cor | Hex | Uso |
|-------|-----|-----|-----|
| `surface` | Azul escuro | `#0F172A` | Fundo principal |
| `surface-soft` | Azul slate | `#1E293B` | Fundo subtil |
| `border` | Cinza slate | `#334155` | Divisores, bordas |
| `foreground` | Branco frio | `#F1F5F9` | Texto principal |
| `muted` | Cinza claro | `#94A3B8` | Texto secundário |

### Cores de Status (Ambos os Modos)

| Status | Hex | Uso |
|--------|-----|-----|
| **success** | `#16A34A` / `#22C55E` | Confirmações, operações bem-sucedidas |
| **warning** | `#D97706` / `#EAB308` | Avisos, ações que requerem atenção |
| **danger** | `#DC2626` / `#EF4444` | Erros, exclusões, operações críticas |

## 🔤 Tipografia

### Fontes

```
Sans Serif (padrão):    Inter, ui-sans-serif, system-ui
Heading/Brand:          Poppins, ui-sans-serif, system-ui
```

### Tamanhos

```
xs        12px  (0.75rem)
sm        14px  (0.875rem)
base      16px  (1rem)
lg        18px  (1.125rem)
xl        20px  (1.25rem)
2xl       24px  (1.5rem)
3xl       30px  (1.875rem)
4xl       36px  (2.25rem)
5xl       48px  (3rem)
```

### Pesos

```
light       300
normal      400
medium      500
semibold    600
bold        700
extrabold   800
```

## 🌙 Dark Mode

Ativado via classe `.dark` no elemento `<html>`.

**Exemplo no app.vue:**
```html
<!-- Toggle dark mode -->
<html :class="{ dark: isDark }">
```

**Mudanças no dark mode:**
- ✅ Cores de surface e texto invertidas
- ✅ Brand e secondary ficam ligeiramente mais claros para contraste
- ✅ Accent e status mantêm harmonia
- ✅ Todas as transições são suaves

## 📐 Espaçamento

Segue escala padrão Tailwind (4px base):

```
0, 1px, 2px (1), 4px (2), 6px (3), 8px (4), 10px (5), 12px (6),
14px (7), 16px (8), 18px (9), 20px (10), 24px (12), 28px (14),
32px (16), 40px (20), 48px (24), 64px (32)
```

## 🔲 Border Radius

```
xs      2px
sm      4px
md      6px
lg      8px
xl      12px
2xl     16px
3xl     24px
full    9999px
```

## 🎭 Shadows

```
soft       1px 2px 3px rgba(0,0,0,0.06)
card       4px 6px 6px rgba(0,0,0,0.08)
elevated   10px 15px 15px rgba(0,0,0,0.10)
```

## 💻 Como Usar

### 1. Com Tailwind CSS (Recomendado para estilos)

```html
<div class="bg-brand-500 text-white rounded-lg p-4 shadow-card">
  Botão com tema brand
</div>

<div class="dark:bg-surface-soft">
  Aplica fundo diferente em dark mode
</div>
```

### 2. Com TypeScript (Para lógica / componentes)

```typescript
import { COLORS_LIGHT, COLORS_DARK, TYPOGRAPHY } from '~/app/utils/design-tokens'

export default {
  setup() {
    const brandColor = COLORS_LIGHT.brand['500'] // #FF6600
    const headingFont = TYPOGRAPHY.fonts.heading // Poppins
    
    return { brandColor, headingFont }
  }
}
```

### 3. Com Composable (Para reatividade em dark mode)

```vue
<template>
  <div :style="{ color: colors.foreground }">
    {{ isDark ? 'Modo escuro' : 'Modo claro' }}
  </div>
  <button @click="toggleTheme">
    Toggle tema
  </button>
</template>

<script lang="ts" setup>
import { useTheme } from '~/app/composables/useTheme'

const { isDark, colors, toggleTheme } = useTheme()
</script>
```

## 📦 Arquivos do Sistema

| Arquivo | Responsabilidade |
|---------|-----------------|
| `tailwind.config.ts` | Extensões de cores, tipografia, espaçamento para Tailwind |
| `app/assets/css/tailwind.css` | Variáveis CSS `:root`, overrides `.dark`, utility classes |
| `app/utils/design-tokens.ts` | Tokens estruturados em TypeScript (constantes) |
| `app/composables/useTheme.ts` | Acesso reativo aos tokens com detecção de dark mode |

## 🎯 Princípios

- ✅ **Centralizado**: Todos os valores de design em um único lugar
- ✅ **Type-safe**: Tokens exportados como constantes TypeScript
- ✅ **Reativo**: Dark mode automático com `useTheme()`
- ✅ **Acessível**: Contraste respeitado em ambos os modos
- ✅ **Escalável**: Fácil adicionar novos tokens

---

**Última atualização:** 19 de março de 2026
