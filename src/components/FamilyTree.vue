<template>
  <div class="family-tree-container">
    <h3>Árbol Genealógico</h3>
    <div v-if="!members || members.length===0" class="empty">No hay miembros. Agrega personas para ver el árbol.</div>
    <div v-else class="tree-wrapper">
      <svg ref="svgRef" class="tree-svg" :width="svgWidth" :height="svgHeight">
        <g :transform="`translate(${padLeft},${padTop})`">
          <!-- Líneas de matrimonio -->
          <g class="marriage-lines">
            <line v-for="ln in marriageLines" :key="ln.id"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2" />
          </g>
          <!-- Líneas padre-hijo -->
          <g class="descent-lines">
            <line v-for="ln in descentLines" :key="ln.id"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2" />
          </g>
          <!-- Líneas de hermanos -->
          <g class="sibling-lines">
            <line v-for="ln in siblingLines" :key="ln.id"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2" />
          </g>
          <!-- Nodos -->
          <g v-for="nd in layoutNodes" :key="nd.id"
            :transform="`translate(${nd.x},${nd.y})`"
            class="node-group"
            @click="onNodeClick(nd)">
            <!-- Fondo -->
            <rect x="-60" y="-25" width="120" height="50" rx="8"
              :class="['node-rect', genderClass(nd.gender)]" />
            <!-- Foto si tiene -->
            <image v-if="nd.photo" :href="nd.photo" x="-52" y="-17" width="34" height="34" class="node-photo" />
            <!-- Nombre (truncado si muy largo) -->
            <text x="0" y="-4" text-anchor="middle"
              :font-size="fontSize(nd.label)" class="node-name"
              :textLength="nd.photo ? 70 : 108" lengthAdjust="spacingAndGlyphs">
              {{ nd.label }}
            </text>
            <!-- Fechas -->
            <text v-if="nd.dates" x="0" y="14" text-anchor="middle"
              font-size="10" class="node-dates"
              textLength="110" lengthAdjust="spacingAndGlyphs">
              {{ nd.dates }}
            </text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const members = ref([])
const svgRef = ref(null)

const NODE_W = 120
const NODE_H = 50
const COUPLE_GAP = 16
const FAMILY_GAP = 40
const V_GAP = 120
const padLeft = 60
const padTop = 40
const padBottom = 40
const padRight = 60

function genderClass(g) {
  if (g === 'hombre') return 'male'
  if (g === 'mujer') return 'female'
  return 'other'
}

function fontSize(name) {
  if (name.length > 14) return 10
  if (name.length > 10) return 11
  return 12
}

function getLevels(membersArr) {
  const levels = {}
  const visited = new Set()
  function dfs(name, level) {
    if (visited.has(name)) return
    visited.add(name)
    if (levels[name] === undefined || level > levels[name]) {
      levels[name] = level
      const m = membersArr.find(x => x.nombre === name)
      if (m && m.hijos) {
        m.hijos.forEach(h => dfs(h, level + 1))
      }
    }
  }
  membersArr
    .filter(m => !m.padres || m.padres.length === 0)
    .forEach(m => dfs(m.nombre, 0))
  return levels
}

function buildLayout(membersArr) {
  if (!membersArr.length) return { nodes: [], marriageLines: [], descentLines: [], siblingLines: [], width: 600, height: 300 }

  const levels = getLevels(membersArr)
  const maxLevel = Object.keys(levels).length > 0 ? Math.max(...Object.values(levels)) : 0

  // Group by level
  const byLevel = {}
  for (let i = 0; i <= maxLevel; i++) byLevel[i] = []
  membersArr.forEach(m => {
    const lvl = levels[m.nombre] !== undefined ? levels[m.nombre] : 0
    byLevel[lvl].push(m)
  })

  // Assign X positions bottom-up
  const pos = {}

  for (let lvl = maxLevel; lvl >= 0; lvl--) {
    const levelMembers = byLevel[lvl] || []
    const nextLevelMembers = byLevel[lvl + 1] || []

    // Build parent->children map for this level's parents
    const parentToChildren = {}
    for (const child of nextLevelMembers) {
      for (const pName of child.padres) {
        if (!parentToChildren[pName]) parentToChildren[pName] = []
        if (!parentToChildren[pName].includes(child.nombre)) {
          parentToChildren[pName].push(child.nombre)
        }
      }
    }

    // Group into families: couples + singles
    const used = new Set()
    const familyGroups = []

    for (const m of levelMembers) {
      if (used.has(m.nombre)) continue
      const myChildren = parentToChildren[m.nombre] || []
      const spouse = m.esposos.find(esp => {
        if (used.has(esp)) return false
        return (levels[esp] === lvl) && (parentToChildren[esp] || []).some(c => myChildren.includes(c))
      })

      if (spouse) {
        const sharedChildren = myChildren.filter(c => (parentToChildren[spouse] || []).includes(c))
        familyGroups.push({ parents: [m.nombre, spouse], children: sharedChildren })
        used.add(m.nombre)
        used.add(spouse)
      } else {
        familyGroups.push({ parents: [m.nombre], children: myChildren })
        used.add(m.nombre)
      }
    }

    // Position families left to right
    let cursorX = 0

    for (const group of familyGroups) {
      const parentNames = group.parents
      const childNames = group.children.filter(c => {
        const child = membersArr.find(x => x.nombre === c)
        return child && levels[c] === lvl + 1
      })

      const childX = childNames.map(n => pos[n]?.x).filter(x => x !== undefined)

      if (childX.length > 0) {
        const minCx = Math.min(...childX)
        const maxCx = Math.max(...childX)
        const centerX = (minCx + maxCx) / 2

        if (parentNames.length === 2) {
          pos[parentNames[0]] = { x: centerX - NODE_W / 2 - COUPLE_GAP / 2, y: lvl * V_GAP }
          pos[parentNames[1]] = { x: centerX + NODE_W / 2 + COUPLE_GAP / 2, y: lvl * V_GAP }
        } else {
          pos[parentNames[0]] = { x: centerX, y: lvl * V_GAP }
        }

        const groupW = parentNames.length === 2 ? NODE_W * 2 + COUPLE_GAP : NODE_W
        cursorX = Math.max(cursorX, centerX + groupW / 2 + FAMILY_GAP)
      } else {
        if (parentNames.length === 2) {
          pos[parentNames[0]] = { x: cursorX, y: lvl * V_GAP }
          pos[parentNames[1]] = { x: cursorX + NODE_W + COUPLE_GAP, y: lvl * V_GAP }
          cursorX += NODE_W * 2 + COUPLE_GAP + FAMILY_GAP
        } else {
          pos[parentNames[0]] = { x: cursorX + NODE_W / 2, y: lvl * V_GAP }
          cursorX += NODE_W + FAMILY_GAP
        }
      }
    }

    // Normalize X
    const minX = Math.min(...Object.values(pos).map(p => p.x), 0)
    if (minX < 0) {
      for (const p of Object.values(pos)) p.x -= minX
    }
  }

  // Build render nodes
  const nodes = membersArr.map(m => {
    const p = pos[m.nombre] || { x: 0, y: 0 }
    return {
      id: m.id || m.nombre,
      label: m.nombre,
      gender: m.genero,
      nombre: m.nombre,
      photo: m.photo || '',
      dates: [m.birthDate, m.deathDate].filter(Boolean).join(' - '),
      genero: m.genero,
      x: p.x,
      y: p.y
    }
  })

  // Build lines
  const marriageLines = []
  const descentLines = []
  const siblingLines = []

  for (const m of membersArr) {
    for (const esp of m.esposos) {
      if (esp > m.nombre) {
        const p1 = pos[m.nombre]
        const p2 = pos[esp]
        if (p1 && p2) {
          marriageLines.push({
            id: `m-${m.nombre}-${esp}`,
            x1: p1.x + NODE_W / 2,
            y1: p1.y,
            x2: p2.x - NODE_W / 2,
            y2: p2.y
          })
        }
      }
    }
  }

  for (const m of membersArr) {
    for (const child of m.hijos) {
      const p1 = pos[m.nombre]
      const p2 = pos[child]
      if (p1 && p2) {
        descentLines.push({
          id: `d-${m.nombre}-${child}`,
          x1: p1.x,
          y1: p1.y + NODE_H / 2,
          x2: p2.x,
          y2: p2.y - NODE_H / 2
        })
      }
    }
  }

  for (const m of membersArr) {
    if (m.hermanos.length > 0) {
      const siblings = [m.nombre, ...m.hermanos].filter((v, i, a) => a.indexOf(v) === i)
      if (siblings.length > 1) {
        const sPos = siblings.map(n => pos[n]).filter(p => p)
        if (sPos.length > 1) {
          const minSx = Math.min(...sPos.map(p => p.x))
          const maxSx = Math.max(...sPos.map(p => p.x))
          const sy = sPos[0].y - NODE_H / 2 - 8
          siblingLines.push({
            id: `s-${m.nombre}`,
            x1: minSx,
            y1: sy,
            x2: maxSx,
            y2: sy
          })
          for (const sp of sPos) {
            siblingLines.push({
              id: `sv-${m.nombre}-${sp.x}`,
              x1: sp.x,
              y1: sy,
              x2: sp.x,
              y2: sp.y - NODE_H / 2
            })
          }
        }
      }
    }
  }

  const allX = Object.values(pos).map(p => p.x)
  const allY = Object.values(pos).map(p => p.y)
  const maxX = Math.max(...allX, 600)
  const maxY = Math.max(...allY, 0)

  return {
    nodes,
    marriageLines,
    descentLines,
    siblingLines,
    width: maxX + NODE_W + padRight,
    height: maxY + NODE_H + padBottom
  }
}

const layoutData = computed(() => buildLayout(members.value))
const layoutNodes = computed(() => layoutData.value.nodes)
const marriageLines = computed(() => layoutData.value.marriageLines)
const descentLines = computed(() => layoutData.value.descentLines)
const siblingLines = computed(() => layoutData.value.siblingLines)
const svgWidth = computed(() => layoutData.value.width)
const svgHeight = computed(() => layoutData.value.height)

function onNodeClick(nd) {
  window.dispatchEvent(new CustomEvent('edit-member', { detail: nd }))
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
.family-tree-container { width: 100%; }
.empty { color: #999; padding: 40px; text-align: center; }
.tree-wrapper { overflow: auto; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; }
.tree-svg { display: block; min-height: 200px; }

.marriage-lines line { stroke: #e91e63; stroke-width: 3; }
.descent-lines line { stroke: #999; stroke-width: 2; }
.sibling-lines line { stroke: #f90; stroke-width: 2; stroke-dasharray: 4 3; }

.node-group { cursor: pointer; }
.node-group:hover .node-rect { filter: brightness(1.15); }

.node-rect { stroke: #fff; stroke-width: 2; transition: filter 0.2s; }
.node-rect.male { fill: #4a90d9; }
.node-rect.female { fill: #e91e63; }
.node-rect.other { fill: #7aa; }

.node-photo { border-radius: 50%; object-fit: cover; pointer-events: none; }
.node-name { fill: #fff; font-weight: 600; }
.node-dates { fill: rgba(255,255,255,0.75); }
</style>
