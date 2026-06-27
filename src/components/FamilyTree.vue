<template>
  <div class="family-tree-container">
    <h3>Árbol Genealógico</h3>
    <div v-if="!members || members.length===0" class="empty">No hay miembros. Agrega personas para ver el árbol.</div>
    <div v-else class="tree-wrapper">
      <svg ref="svgRef" class="tree-svg">
        <g :transform="`translate(${margin.left},${margin.top})`">
          <g class="links">
            <line v-for="link in links" :key="link.id"
              :x1="link.x1" :y1="link.y1"
              :x2="link.x2" :y2="link.y2"
              :class="link.type" />
          </g>
          <g class="nodes">
            <g v-for="node in nodes" :key="node.id"
              :transform="`translate(${node.x},${node.y})`"
              class="node-group"
              @click="onNodeClick(node)">
              <image v-if="node.photo" :href="node.photo" x="-24" y="-24" width="48" height="48" class="node-photo" />
              <rect v-else :x="-30" :y="-20" width="60" height="40" :rx="6" :class="['node-rect', node.gender]" />
              <text y="32" text-anchor="middle" class="node-name">{{ node.label }}</text>
              <text y="44" text-anchor="middle" class="node-dates">{{ node.dates }}</text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'

const members = ref([])
const svgRef = ref(null)
const margin = { top: 40, left: 50, right: 50, bottom: 40 }

function getMemberColor(genero) {
  switch(genero) {
    case 'hombre': return '#4a90d9'
    case 'mujer': return '#e91e63'
    default: return '#7aa'
  }
}

const nodes = computed(() => {
  return members.value.map(m => ({
    id: m.id || m.nombre,
    label: m.nombre,
    gender: m.genero,
    photo: m.photo || '',
    dates: [m.birthDate, m.deathDate].filter(Boolean).join(' - '),
    x: 0,
    y: 0
  }))
})

function layoutNodes(membersArr) {
  const niveles = {}
  function dfs(nombre, nivel) {
    if (niveles[nombre] === undefined || nivel < niveles[nombre]) {
      niveles[nombre] = nivel
      const m = membersArr.find(x => x.nombre === nombre)
      if (m && m.hijos) {
        m.hijos.forEach(h => dfs(h, nivel + 1))
      }
    }
  }
  membersArr.filter(m => !m.padres || m.padres.length === 0).forEach(m => dfs(m.nombre, 0))

  const maxNivel = Object.values(niveles).length > 0 ? Math.max(...Object.values(niveles)) : 0
  const porNivel = Array.from({ length: maxNivel + 1 }, () => [])
  membersArr.forEach(m => {
    const nivel = niveles[m.nombre] || 0
    porNivel[nivel].push(m.nombre)
  })

  const svgEl = svgRef.value
  const width = svgEl ? svgEl.clientWidth || 900 : 900
  const drawW = width - margin.left - margin.right
  const maxPorNivel = Math.max(...porNivel.map(n => n.length), 1)
  const sepX = Math.min(drawW / (maxPorNivel + 1), 160)
  const totalW = sepX * (maxPorNivel + 1)

  const pos = {}
  porNivel.forEach((nombres, nivel) => {
    const y = nivel * 110
    const startX = (drawW - nombres.length * sepX) / 2
    nombres.forEach((nombre, i) => {
      pos[nombre] = { x: startX + i * sepX + sepX / 2, y }
    })
  })

  return { pos, width: Math.max(totalW + margin.left + margin.right, 600) }
}

function computeLinks(membersArr, pos) {
  const result = []
  for (const m of membersArr) {
    const from = pos[m.nombre]
    if (!from) continue

    for (const padre of m.padres) {
      const to = pos[padre]
      if (to) {
        result.push({
          id: `p-${padre}-${m.nombre}`,
          x1: to.x, y1: to.y + 20,
          x2: from.x, y2: from.y - 20,
          type: 'link-parent'
        })
      }
    }

    for (const hno of m.hermanos) {
      if (hno > m.nombre) {
        const hPos = pos[hno]
        if (hPos) {
          result.push({
            id: `h-${m.nombre}-${hno}`,
            x1: from.x, y1: from.y,
            x2: hPos.x, y2: hPos.y,
            type: 'link-sibling'
          })
        }
      }
    }

    for (const esp of m.esposos) {
      if (esp > m.nombre) {
        const ePos = pos[esp]
        if (ePos) {
          result.push({
            id: `e-${m.nombre}-${esp}`,
            x1: from.x, y1: from.y,
            x2: ePos.x, y2: ePos.y,
            type: 'link-spouse'
          })
        }
      }
    }
  }
  return result
}

const links = computed(() => {
  if (!members.value.length) return []
  const { pos } = layoutNodes(members.value)
  return computeLinks(members.value, pos)
})

const svgHeight = computed(() => {
  if (!members.value.length) return 300
  const { pos } = layoutNodes(members.value)
  const maxY = Math.max(...Object.values(pos).map(p => p.y), 0)
  return maxY + 120 + margin.top + margin.bottom
})

const svgWidth = computed(() => {
  if (!members.value.length) return 600
  const { width } = layoutNodes(members.value)
  return width
})

function onNodeClick(node) {
  window.dispatchEvent(new CustomEvent('edit-member', { detail: node }))
}

function refresh() {
  const tree = window.__FAMILY_TREE__
  members.value = tree ? Object.values(tree.members || {}) : []
}

let interval
onMounted(() => {
  refresh()
  interval = setInterval(refresh, 500)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.family-tree-container {
  width: 100%;
}

.empty {
  color: #999;
  padding: 40px;
  text-align: center;
}

.tree-wrapper {
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.tree-svg {
  display: block;
  min-height: 300px;
}

.link-parent {
  stroke: #999;
  stroke-width: 2;
}

.link-sibling {
  stroke: #f90;
  stroke-width: 2;
  stroke-dasharray: 4 3;
}

.link-spouse {
  stroke: #e06;
  stroke-width: 2;
  stroke-dasharray: 2 4;
}

.node-group {
  cursor: pointer;
}

.node-group:hover .node-rect {
  stroke-width: 3;
  stroke: #333;
}

.node-rect {
  stroke: #fff;
  stroke-width: 2;
  transition: stroke 0.2s;
}

.node-rect.hombre {
  fill: #4a90d9;
}

.node-rect.mujer {
  fill: #e91e63;
}

.node-rect.otro {
  fill: #7aa;
}

.node-photo {
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.node-name {
  fill: #333;
  font-size: 12px;
  font-weight: 600;
}

.node-dates {
  fill: #888;
  font-size: 10px;
}
</style>
