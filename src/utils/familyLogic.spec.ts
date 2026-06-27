/**
 * Tests unitarios para FamilyLogic
 * Vitest + @testing-library
 */

import { describe, it, expect, beforeEach } from 'vitest'
import FamilyTree from '@/utils/familyLogic'

describe('FamilyTree', () => {
  let tree: FamilyTree

  beforeEach(() => {
    tree = new FamilyTree()
  })

  describe('addMember', () => {
    it('debe agregar un nuevo miembro', () => {
      const member = tree.addMember('Juan', 'hombre')
      expect(member.nombre).toBe('Juan')
      expect(member.genero).toBe('hombre')
      expect(Object.keys(tree.members).length).toBe(1)
    })

    it('debe lanzar error si el nombre está vacío', () => {
      expect(() => tree.addMember('', 'hombre')).toThrow('El nombre no puede estar vacío')
    })

    it('debe actualizar género si la persona ya existe', () => {
      tree.addMember('Ana', 'mujer')
      const member = tree.addMember('Ana', 'hombre')
      expect(member.genero).toBe('hombre')
    })
  })

  describe('addRelation', () => {
    beforeEach(() => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
    })

    it('debe agregar relación padre-hijo', () => {
      tree.addRelation('Juan', 'Ana', 'padre')
      expect(tree.getMember('Juan')?.hijos).toContain('Ana')
      expect(tree.getMember('Ana')?.padres).toContain('Juan')
    })

    it('debe agregar relación hermano', () => {
      tree.addMember('Pedro', 'hombre')
      tree.addRelation('Ana', 'Pedro', 'hermano')
      expect(tree.getMember('Ana')?.hermanos).toContain('Pedro')
      expect(tree.getMember('Pedro')?.hermanos).toContain('Ana')
    })

    it('debe agregar relación conyugal', () => {
      tree.addRelation('Juan', 'Ana', 'esposo')
      expect(tree.getMember('Juan')?.esposos).toContain('Ana')
      expect(tree.getMember('Ana')?.esposos).toContain('Juan')
    })

    it('debe lanzar error si la persona es la misma', () => {
      expect(() => tree.addRelation('Juan', 'Juan', 'padre')).toThrow(
        'No puedes ser tu propia pareja o relación'
      )
    })
  })

  describe('validateRelation', () => {
    beforeEach(() => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addMember('Carlos', 'hombre')
    })

    it('debe prevenir ciclos', () => {
      tree.addRelation('Juan', 'Ana', 'padre')
      tree.addRelation('Ana', 'Carlos', 'padre')
      // Carlos no puede ser padre de Juan (crearía ciclo)
      expect(() => tree.addRelation('Carlos', 'Juan', 'padre')).toThrow()
    })

    it('debe permitir relaciones válidas', () => {
      expect(() => {
        tree.addRelation('Juan', 'Ana', 'padre')
        tree.addRelation('Ana', 'Carlos', 'padre')
      }).not.toThrow()
    })
  })

  describe('removeMember', () => {
    it('debe eliminar un miembro', () => {
      tree.addMember('Juan', 'hombre')
      tree.removeMember('Juan')
      expect(tree.getMember('Juan')).toBeUndefined()
      expect(Object.keys(tree.members).length).toBe(0)
    })

    it('debe lanzar error si el miembro no existe', () => {
      expect(() => tree.removeMember('NoExiste')).toThrow('NoExiste no existe en el árbol')
    })

    it('debe remover relaciones inversas al eliminar', () => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addRelation('Juan', 'Ana', 'padre')
      tree.removeMember('Juan')
      expect(tree.getMember('Ana')?.padres).not.toContain('Juan')
    })
  })

  describe('getRoot', () => {
    it('debe retornar null si no hay miembros', () => {
      expect(tree.getRoot()).toBeNull()
    })

    it('debe retornar el miembro sin padres', () => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addRelation('Juan', 'Ana', 'padre')
      const root = tree.getRoot()
      expect(root?.nombre).toBe('Juan')
    })
  })

  describe('hermanos', () => {
    it('debe actualizar hermanos automáticamente', () => {
      tree.addMember('Padre', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addMember('Juan', 'hombre')
      tree.addRelation('Ana', 'Padre', 'hijo')
      tree.addRelation('Juan', 'Padre', 'hijo')
      
      expect(tree.getMember('Ana')?.hermanos).toContain('Juan')
      expect(tree.getMember('Juan')?.hermanos).toContain('Ana')
    })
  })

  describe('abuelos', () => {
    it('debe actualizar abuelos automáticamente', () => {
      tree.addMember('Abuelo', 'hombre')
      tree.addMember('Padre', 'hombre')
      tree.addMember('Hijo', 'hombre')
      
      tree.addRelation('Padre', 'Abuelo', 'hijo')
      tree.addRelation('Hijo', 'Padre', 'hijo')
      
      expect(tree.getMember('Hijo')?.abuelos).toContain('Abuelo')
    })
  })

  describe('JSON serialization', () => {
    it('debe serializar y deserializar correctamente', () => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addRelation('Juan', 'Ana', 'padre')
      
      const json = tree.toJSON()
      const newTree = new FamilyTree()
      newTree.fromJSON(json)
      
      expect(Object.keys(newTree.members).length).toBe(2)
      expect(newTree.getMember('Juan')?.hijos).toContain('Ana')
    })
  })
})
