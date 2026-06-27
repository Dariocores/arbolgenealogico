import { defineStore } from 'pinia'
import FamilyTree from '@/utils/familyLogic'

export const useFamilyStore = defineStore('family', {
  state: () => ({
    tree: new FamilyTree()
  }),

  getters: {
    memberCount: (state) => state.tree.memberCount,
    rootMember: (state) => state.tree.getRoot(),
    members: (state) => state.tree.getAllMembers(),
    getMember: (state) => (name) => state.tree.getMember(name)
  },

  actions: {
    loadFromStorage() {
      this.tree.loadFromStorage()
    },
    saveToStorage() {
      this.tree.saveToStorage()
    },
    addMember(nombre, genero) {
      this.tree.addMember(nombre, genero)
    },
    addRelation(nombre, relacionado, tipo) {
      this.tree.addRelation(nombre, relacionado, tipo)
    },
    removeMember(nombre) {
      this.tree.removeMember(nombre)
    },
    clearTree() {
      this.tree = new FamilyTree()
      this.tree.saveToStorage()
      window.__FAMILY_TREE__ = this.tree
    }
  }
})
