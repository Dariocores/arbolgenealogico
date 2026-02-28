/**
 * Lógica de relaciones familiares (TypeScript)
 * Maneja la creación y validación de relaciones
 */

export type Gender = 'hombre' | 'mujer' | 'otro'

export type RelationType = 'padre' | 'hijo' | 'hermano' | 'esposo' | 'abuelo' | 'bisabuelo'

export interface FamilyMember {
  nombre: string
  genero: Gender
  padres: string[]
  hijos: string[]
  hermanos: string[]
  esposos: string[]
  abuelos: string[]
  bisabuelos: string[]
}

export interface Members {
  [key: string]: FamilyMember
}

export class FamilyTree {
  members: Members = {}

  /**
   * Obtiene la cantidad de miembros
   */
  get memberCount(): number {
    return Object.keys(this.members).length
  }

  /**
   * Método alternativo para obtener la cantidad de miembros
   */
  getMemberCount(): number {
    return Object.keys(this.members).length
  }

  /**
   * Agrega un nuevo miembro al árbol
   */
  addMember(nombre: string, genero: Gender = 'hombre'): FamilyMember {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre no puede estar vacío')
    }

    if (this.members[nombre]) {
      this.members[nombre].genero = genero
      this._saveToStorage()
      return this.members[nombre]
    }

    const member: FamilyMember = {
      nombre,
      genero,
      padres: [],
      hijos: [],
      hermanos: [],
      esposos: [],
      abuelos: [],
      bisabuelos: []
    }

    this.members[nombre] = member
    this._saveToStorage()
    return member
  }

  /**
   * Valida si una relación es posible
   */
  validateRelation(persona1: string, persona2: string, tipo: RelationType): void {
    if (persona1 === persona2) {
      throw new Error('No puedes ser tu propia pareja o relación')
    }

    // Evitar ciclos: persona1 no puede ser descendiente de persona2
    if (this._isDescendantOf(persona1, persona2)) {
      throw new Error(`${persona1} es descendiente de ${persona2}. Relación inválida.`)
    }

    if (['padre', 'hijo', 'abuelo', 'bisabuelo'].includes(tipo)) {
      if (this._isDescendantOf(persona2, persona1)) {
        throw new Error(`${persona2} es descendiente de ${persona1}. Relación inválida.`)
      }
    }
  }

  /**
   * Comprueba si personaA es descendiente de personaB
   */
  private _isDescendantOf(personaA: string, personaB: string, visited: Set<string> = new Set()): boolean {
    if (visited.has(personaA)) return false
    visited.add(personaA)

    const member = this.members[personaA]
    if (!member) return false

    if (member.padres.includes(personaB)) return true

    for (const padre of member.padres) {
      if (this._isDescendantOf(padre, personaB, visited)) return true
    }

    return false
  }

  /**
   * Agrega una relación entre dos personas
   */
  addRelation(nombre: string, personaRelacionada: string, tipoRelacion: RelationType): void {
    const m1 = this.addMember(nombre)
    const m2 = this.addMember(personaRelacionada)

    this.validateRelation(nombre, personaRelacionada, tipoRelacion)

    switch (tipoRelacion) {
      case 'padre':
        // m1 es el padre de m2
        if (!m2.padres.includes(nombre)) {
          m2.padres.push(nombre)
        }
        if (!m1.hijos.includes(personaRelacionada)) {
          m1.hijos.push(personaRelacionada)
        }
        this._updateHermanos(m1.hijos)
        this._updateAbuelos(personaRelacionada)
        break

      case 'hijo':
        // Interpretar 'hijo' como "agregar hijo a nombre": nombre es padre de personaRelacionada
        if (!m2.padres.includes(nombre)) {
          m2.padres.push(nombre)
        }
        if (!m1.hijos.includes(personaRelacionada)) {
          m1.hijos.push(personaRelacionada)
        }
        this._updateHermanos(m1.hijos)
        this._updateAbuelos(personaRelacionada)
        break

      case 'hermano':
        if (!m1.hermanos.includes(personaRelacionada)) {
          m1.hermanos.push(personaRelacionada)
        }
        if (!m2.hermanos.includes(nombre)) {
          m2.hermanos.push(nombre)
        }
        const todosHermanos = new Set([
          ...m1.hermanos,
          nombre,
          ...m2.hermanos,
          personaRelacionada
        ])
        for (const h1 of todosHermanos) {
          for (const h2 of todosHermanos) {
            if (h1 !== h2 && !this.members[h1].hermanos.includes(h2)) {
              this.members[h1].hermanos.push(h2)
            }
          }
        }
        break

      case 'esposo':
        if (!m1.esposos.includes(personaRelacionada)) {
          m1.esposos.push(personaRelacionada)
        }
        if (!m2.esposos.includes(nombre)) {
          m2.esposos.push(nombre)
        }
        break

      case 'abuelo':
        if (!m1.padres.includes(personaRelacionada)) {
          m1.padres.push(personaRelacionada)
        }
        if (!m1.abuelos.includes(personaRelacionada)) {
          m1.abuelos.push(personaRelacionada)
        }
        if (!m2.hijos.includes(nombre)) {
          m2.hijos.push(nombre)
        }
        break

      case 'bisabuelo':
        if (!m1.bisabuelos.includes(personaRelacionada)) {
          m1.bisabuelos.push(personaRelacionada)
        }
        if (!m2.hijos.includes(nombre)) {
          m2.hijos.push(nombre)
        }
        break
    }
  }

  /**
   * Actualiza hermanos automáticamente
   */
  private _updateHermanos(hermanos: string[]): void {
    for (const h1 of hermanos) {
      for (const h2 of hermanos) {
        if (h1 !== h2 && !this.members[h1].hermanos.includes(h2)) {
          this.members[h1].hermanos.push(h2)
        }
      }
    }
  }

  /**
   * Actualiza abuelos automáticamente
   */
  private _updateAbuelos(personaNombre: string): void {
    const persona = this.members[personaNombre]
    const nuevosAbuelos = new Set<string>()

    for (const padre of persona.padres) {
      const padreData = this.members[padre]
      if (padreData) {
        for (const abuelo of padreData.padres) {
          nuevosAbuelos.add(abuelo)
        }
      }
    }

    persona.abuelos = Array.from(nuevosAbuelos)
  }

  /**
   * Elimina un miembro del árbol
   */
  removeMember(nombre: string): void {
    if (!this.members[nombre]) {
      throw new Error(`${nombre} no existe en el árbol`)
    }

    const member = this.members[nombre]

    // Remover relaciones inversas
    member.padres.forEach(padre => {
      const p = this.members[padre]
      if (p) p.hijos = p.hijos.filter(h => h !== nombre)
    })

    member.hijos.forEach(hijo => {
      const h = this.members[hijo]
      if (h) h.padres = h.padres.filter(p => p !== nombre)
    })

    member.hermanos.forEach(hermano => {
      const h = this.members[hermano]
      if (h) h.hermanos = h.hermanos.filter(hm => hm !== nombre)
    })

    member.esposos.forEach(esposo => {
      const e = this.members[esposo]
      if (e) e.esposos = e.esposos.filter(es => es !== nombre)
    })

    delete this.members[nombre]
    this._saveToStorage()
  }
  /**
   * Guarda el árbol en localStorage
   */
  private _saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('familyTree', JSON.stringify(this.members))
    }
  }

  /**
   * Carga el árbol desde localStorage
   */
  loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem('familyTree')
      if (data) {
        this.members = JSON.parse(data)
      }
    }
  }

  /**
   * Obtiene todos los miembros
   */
  getAllMembers(): FamilyMember[] {
    return Object.values(this.members)
  }

  /**
   * Obtiene un miembro por nombre
   */
  getMember(nombre: string): FamilyMember | undefined {
    return this.members[nombre]
  }

  /**
   * Obtiene la raíz del árbol (quien no tiene padres)
   */
  getRoot(): FamilyMember | null {
    for (const member of Object.values(this.members)) {
      if (member.padres.length === 0) {
        return member
      }
    }
    return null
  }

  /**
   * Exporta los datos a formato JSON
   */
  toJSON(): Members {
    return this.members
  }

  /**
   * Carga datos desde JSON
   */
  fromJSON(data: Members): void {
    this.members = { ...data }
  }
}

export default FamilyTree
