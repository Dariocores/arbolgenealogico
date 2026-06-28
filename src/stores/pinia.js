import { defineStore } from 'pinia'
import FamilyTree from '@/utils/familyLogic'

function getStorageKey(treeName) {
  return 'familyTree_' + treeName
}

export const useFamilyStore = defineStore('family', {
  state: () => ({
    tree: new FamilyTree(),
    treeName: 'default',
    treeList: ['default']
  }),

  getters: {
    memberCount: (state) => state.tree.memberCount,
    rootMember: (state) => state.tree.getRoot(),
    members: (state) => state.tree.getAllMembers(),
    getMember: (state) => (name) => state.tree.getMember(name)
  },

  actions: {
    loadTreeList() {
      try {
        const list = localStorage.getItem('familyTree_list')
        if (list) this.treeList = JSON.parse(list)
      } catch { this.treeList = ['default'] }
      if (!this.treeList.includes('default')) this.treeList.unshift('default')
    },
    saveTreeList() {
      localStorage.setItem('familyTree_list', JSON.stringify(this.treeList))
    },
    switchTree(name) {
      this.treeName = name
      this.tree = new FamilyTree()
      this.tree.storageKey = getStorageKey(name)
      this.tree.loadFromStorage()
      window.__FAMILY_TREE__ = this.tree
    },
    createTree(name) {
      if (this.treeList.includes(name)) return false
      this.treeList.push(name)
      this.saveTreeList()
      this.switchTree(name)
      return true
    },
    deleteTree(name) {
      if (name === 'default') return false
      this.treeList = this.treeList.filter(t => t !== name)
      this.saveTreeList()
      localStorage.removeItem(getStorageKey(name))
      this.switchTree('default')
      return true
    },
    loadFromStorage() {
      this.tree.storageKey = getStorageKey(this.treeName)
      this.tree.loadFromStorage()
      window.__FAMILY_TREE__ = this.tree
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
      this.tree.storageKey = getStorageKey(this.treeName)
      this.tree.saveToStorage()
      window.__FAMILY_TREE__ = this.tree
    }
  }
})
