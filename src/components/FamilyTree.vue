<template>
  <div>
    <h3>Árbol</h3>
    <div v-if="!members || members.length===0" style="color:#999">No hay miembros</div>
    <svg v-else :width="svgWidth" :height="svgHeight">
      <!-- Dibujar líneas entre padres e hijos -->
      <g v-for="(m, i) in members" :key="'lines-'+m.name">
        <template v-for="p in m.padres">
          <line v-if="memberIndex[p] !== undefined"
            :x1="getX(memberIndex[p])"
            :y1="getY(0)"
            :x2="getX(i)"
            :y2="getY(1)"
            stroke="#aaa" stroke-width="2" />
        </template>
      </g>
      <!-- Dibujar nodos de la generación 0 (sin padres) -->
      <g v-for="(m, i) in rootMembers" :key="'root-'+m.name">
        <circle :cx="getX(i)" :cy="getY(0)" r="36" fill="#7aa" />
        <text :x="getX(i)" :y="getY(0)+5" text-anchor="middle" fill="#fff">{{ m.name }}</text>
      </g>
      <!-- Dibujar nodos de la generación 1 (con padres) -->
      <g v-for="(m, i) in childMembers" :key="'child-'+m.name">
        <circle :cx="getX(i)" :cy="getY(1)" r="36" fill="#5a9" />
        <text :x="getX(i)" :y="getY(1)+5" text-anchor="middle" fill="#fff">{{ m.name }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const members = ref([])
const svgWidth = 800
const svgHeight = 300

function refresh() {
  const tree = window.__FAMILY_TREE__
  members.value = tree ? Object.values(tree.members || {}) : []
}

const rootMembers = computed(() => members.value.filter(m => !m.padres || m.padres.length === 0))
const childMembers = computed(() => members.value.filter(m => m.padres && m.padres.length > 0))

const memberIndex = computed(() => {
  const idx = {}
  rootMembers.value.forEach((m, i) => { idx[m.name] = i })
  childMembers.value.forEach((m, i) => { idx[m.name] = i })
  return idx
})

function getX(i) {
  // Espaciado horizontal
  return 120 + i * 160
}
function getY(gen) {
  // gen=0: raíz, gen=1: hijos
  return gen === 0 ? 70 : 220
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
