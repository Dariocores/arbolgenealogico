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

    it('debe lanzar error con fecha inválida', () => {
      expect(() => tree.addMember('Juan', 'hombre', { birthDate: 'no-es-fecha' }))
        .toThrow('Fecha de nacimiento inválida')
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

    it('debe asignar tipo de padre por defecto', () => {
      tree.addRelation('Juan', 'Ana', 'padre')
      expect(tree.getParentType('Ana', 'Juan')).toBe('biologico')
    })

    it('debe aceptar tipo de padre personalizado', () => {
      tree.addRelation('Juan', 'Ana', 'padre', 'adoptivo')
      expect(tree.getParentType('Ana', 'Juan')).toBe('adoptivo')
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

    it('debe asignar estado casado por defecto', () => {
      tree.addRelation('Juan', 'Ana', 'esposo')
      expect(tree.getMarriageStatus('Juan', 'Ana')).toBe('casado')
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
      expect(() => tree.addRelation('Carlos', 'Juan', 'padre')).toThrow()
    })

    it('debe permitir relaciones válidas', () => {
      expect(() => {
        tree.addRelation('Juan', 'Ana', 'padre')
        tree.addRelation('Ana', 'Carlos', 'padre')
      }).not.toThrow()
    })
  })

  describe('removeRelation', () => {
    beforeEach(() => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
    })

    it('debe eliminar relación padre-hijo', () => {
      tree.addRelation('Juan', 'Ana', 'padre')
      tree.removeRelation('Juan', 'Ana', 'padre')
      expect(tree.getMember('Juan')?.hijos).not.toContain('Ana')
      expect(tree.getMember('Ana')?.padres).not.toContain('Juan')
    })

    it('debe eliminar relación esposo', () => {
      tree.addRelation('Juan', 'Ana', 'esposo')
      tree.removeRelation('Juan', 'Ana', 'esposo')
      expect(tree.getMember('Juan')?.esposos).not.toContain('Ana')
      expect(tree.getMember('Ana')?.esposos).not.toContain('Juan')
      expect(tree.getMarriageStatus('Juan', 'Ana')).toBe('casado')
    })
  })

  describe('setMarriageStatus', () => {
    it('debe cambiar estado del matrimonio', () => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addRelation('Juan', 'Ana', 'esposo')
      tree.setMarriageStatus('Juan', 'Ana', 'divorciado')
      expect(tree.getMarriageStatus('Juan', 'Ana')).toBe('divorciado')
      expect(tree.getMarriageStatus('Ana', 'Juan')).toBe('divorciado')
    })
  })

  describe('parentType', () => {
    it('debe asignar y leer tipo de padre', () => {
      tree.addMember('Juan', 'hombre')
      tree.addMember('Ana', 'mujer')
      tree.addRelation('Juan', 'Ana', 'padre', 'adoptivo')
      expect(tree.getParentType('Ana', 'Juan')).toBe('adoptivo')

      tree.setParentType('Ana', 'Juan', 'biologico')
      expect(tree.getParentType('Ana', 'Juan')).toBe('biologico')
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
      tree.addRelation('Juan', 'Ana', 'esposo')
      tree.removeMember('Juan')
      expect(tree.getMember('Ana')?.padres).not.toContain('Juan')
      expect(tree.getMember('Ana')?.esposos).not.toContain('Juan')
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

    it('debe preservar nuevos campos', () => {
      tree.addMember('Juan', 'hombre', { ocupacion: 'Ingeniero', religion: 'Católica', notas: 'Nota de prueba' })
      tree.addMember('Ana', 'mujer')
      tree.addRelation('Juan', 'Ana', 'padre', 'adoptivo')
      tree.addRelation('Juan', 'Ana', 'esposo')
      tree.setMarriageStatus('Juan', 'Ana', 'separado')

      const json = tree.toJSON()
      const newTree = new FamilyTree()
      newTree.fromJSON(json)

      const juan = newTree.getMember('Juan')
      expect(juan?.ocupacion).toBe('Ingeniero')
      expect(juan?.religion).toBe('Católica')
      expect(juan?.notas).toBe('Nota de prueba')
      expect(newTree.getParentType('Ana', 'Juan')).toBe('adoptivo')
      expect(newTree.getMarriageStatus('Juan', 'Ana')).toBe('separado')
    })
  })

  describe('GEDCOM export', () => {
    it('debe exportar tags avanzados', () => {
      tree.addMember('Juan', 'hombre', { ocupacion: 'Ingeniero', religion: 'Católica', notas: 'Nota' })
      const ged = tree.toGEDCOM()
      expect(ged).toContain('1 OCCU Ingeniero')
      expect(ged).toContain('1 RELI Católica')
      expect(ged).toContain('1 NOTE Nota')
    })
  })
})
