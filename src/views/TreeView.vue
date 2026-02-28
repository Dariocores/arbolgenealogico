<template>
  <div class="tree-view">
    <div class="tree-content">
      <div class="tree-left">
        <FamilyForm />
        <PersonList />
      </div>
      <div class="tree-right">
        <FamilyTree />
      </div>
    </div>
  </div>
</template>

<script setup>
import FamilyForm from '../components/FamilyForm.vue';
import FamilyTree from '../components/FamilyTree.vue';
import PersonList from '../components/PersonList.vue';
</script>

<style scoped>
.tree-view {
  padding: 20px;
}

.tree-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  max-width: 1800px;
  margin: 0 auto;
}

.tree-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tree-right {
  position: sticky;
  top: 20px;
  height: fit-content;
}

@media (max-width: 1200px) {
  .tree-content {
    grid-template-columns: 1fr;
  }

  .tree-right {
    position: relative;
    top: auto;
  }
}
</style>
