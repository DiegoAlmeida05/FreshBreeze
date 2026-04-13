const TAG_PRIORITY = ['checkin', 'deep clean', 'make sofa', 'one stay'] as const

const tagPriorityMap = new Map(TAG_PRIORITY.map((tag, index) => [tag, index]))

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTagList(tags: string[]): string[] {
  const normalized = tags
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag.length > 0)

  return Array.from(new Set(normalized))
}

export function sortVisualReferenceTags(tags: string[]): string[] {
  return [...normalizeTagList(tags)].sort((left, right) => {
    const leftPriority = tagPriorityMap.get(left) ?? Number.MAX_SAFE_INTEGER
    const rightPriority = tagPriorityMap.get(right) ?? Number.MAX_SAFE_INTEGER

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return left.localeCompare(right)
  })
}

export function buildVisibleTaskTags(taskTags: string[], propertyDefaultTags: string[]): string[] {
  const normalizedTaskTags = normalizeTagList(taskTags)
  const normalizedPropertyTags = normalizeTagList(propertyDefaultTags)
  const mergedTags = [...normalizedTaskTags]

  for (const propertyTag of normalizedPropertyTags) {
    if (!mergedTags.includes(propertyTag)) {
      mergedTags.push(propertyTag)
    }
  }

  return sortVisualReferenceTags(mergedTags)
}

export { TAG_PRIORITY }