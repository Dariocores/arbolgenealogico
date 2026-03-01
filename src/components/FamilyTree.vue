<template>
  <div>
    <h3>Árbol</h3>
    <div v-if="!members || members.length===0" style="color:#999">No hay miembros</div>
    <svg v-else :width="svgWidth" :height="svgHeight">
      <!-- Dibujar líneas entre padres e hijos para todas las generaciones -->
      <g v-for="m in members" :key="'lines-'+m.nombre">
        <template v-for="padre in m.padres">
          <line v-if="positions[padre] && positions[m.nombre]"
            :x1="positions[padre].x"
            :y1="positions[padre].y + nodeRadius"
            :x2="positions[m.nombre].x"
            :y2="positions[m.nombre].y - nodeRadius"
            stroke="#aaa" stroke-width="2" />
        </template>
      </g>
      <!-- Dibujar líneas entre hermanos -->
      <g v-for="m in members" :key="'hermanos-'+m.nombre">
        <template v-for="hermano in m.hermanos">
          <line v-if="positions[hermano] && positions[m.nombre] && hermano > m.nombre"
            :x1="positions[m.nombre].x"
            :y1="positions[m.nombre].y"
            :x2="positions[hermano].x"
            :y2="positions[hermano].y"
            stroke="#f90" stroke-width="2" stroke-dasharray="4 2" />
        </template>
      </g>
      <!-- Dibujar líneas entre parejas -->
      <g v-for="m in members" :key="'parejas-'+m.nombre">
        <template v-for="pareja in m.esposos">
          <line v-if="positions[pareja] && positions[m.nombre] && pareja > m.nombre"
            :x1="positions[m.nombre].x"
            :y1="positions[m.nombre].y"
            :x2="positions[pareja].x"
            :y2="positions[pareja].y"
            stroke="#e06" stroke-width="2" stroke-dasharray="1 5" />
        </template>
      </g>
      <!-- Dibujar nodos para todos los miembros -->
      <g v-for="m in members" :key="'node-'+m.nombre">
        <circle :cx="positions[m.nombre]?.x" :cy="positions[m.nombre]?.y" :r="nodeRadius" fill="#7aa" />
        <text :x="positions[m.nombre]?.x" :y="positions[m.nombre]?.y+5" text-anchor="middle" fill="#fff">{{ m.nombre }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const members = ref([])
const svgWidth = 1200
const svgHeight = 600
const nodeRadius = 36

// Calcular niveles (generaciones) para cada miembro
function calcularNiveles(membersArr) {
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
  // Raíces: miembros sin padres
  membersArr.filter(m => !m.padres || m.padres.length === 0).forEach(m => dfs(m.nombre, 0))
  return niveles
}

const positions = computed(() => {
  if (!members.value.length) return {}
  const niveles = calcularNiveles(members.value)
  const maxNivel = Math.max(...Object.values(niveles))
  // Agrupar miembros por nivel
  const porNivel = Array.from({ length: maxNivel + 1 }, () => [])
  members.value.forEach(m => {
    const nivel = niveles[m.nombre] || 0
    porNivel[nivel].push(m.nombre)
  })
  // Calcular posiciones
  const pos = {}
  porNivel.forEach((nombres, nivel) => {
    const y = 80 + nivel * 120
    const sep = svgWidth / (nombres.length + 1)
    nombres.forEach((nombre, i) => {
      pos[nombre] = { x: sep * (i + 1), y }
    })
  })
  return pos
})

function refresh() {
  const tree = window.__FAMILY_TREE__
  members.value = tree ? Object.values(tree.members || {}) : []
}

onMounted(() => {
  refresh()
  setInterval(refresh, 500)
})
</script>

<style scoped>
svg { background:#fff; border:1px solid #eee }
line { stroke-dasharray: 2 2; }
</style>
