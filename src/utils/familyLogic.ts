export type Gender = 'hombre' | 'mujer' | 'otro'

export type RelationType = 'padre' | 'hijo' | 'hermano' | 'esposo' | 'abuelo' | 'bisabuelo'

export type ParentType = 'biologico' | 'adoptivo' | 'padrastro' | 'madrastra'

export type MarriageStatus = 'casado' | 'divorciado' | 'separado' | 'viudo'

export interface FamilyMember {
  id: string
  nombre: string
  genero: Gender
  birthDate: string
  deathDate: string
  birthPlace: string
  deathPlace: string
  biography: string
  photo: string
  ocupacion: string
  religion: string
  notas: string
  padres: string[]
  hijos: string[]
  hermanos: string[]
  esposos: string[]
  abuelos: string[]
  bisabuelos: string[]
  tipoPadre: Record<string, ParentType>
  estadoMatrimonio: Record<string, MarriageStatus>
  divorceDate: Record<string, string>
}

export interface Members {
  [key: string]: FamilyMember
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function isValidDate(d: string): boolean {
  if (!d) return true
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d))
}

export class FamilyTree {
  members: Members = {}
  storageKey: string = 'familyTree'

  get memberCount(): number {
    return Object.keys(this.members).length
  }

  getMemberCount(): number {
    return Object.keys(this.members).length
  }

  addMember(
    nombre: string,
    genero: Gender = 'hombre',
    data?: Partial<FamilyMember>
  ): FamilyMember {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre no puede estar vacío')
    }

    if (data?.birthDate && !isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento inválida')
    }
    if (data?.deathDate && !isValidDate(data.deathDate)) {
      throw new Error('Fecha de muerte inválida')
    }

    if (this.members[nombre]) {
      const existing = this.members[nombre]
      existing.genero = genero
      if (data?.birthDate) existing.birthDate = data.birthDate
      if (data?.deathDate) existing.deathDate = data.deathDate
      if (data?.birthPlace) existing.birthPlace = data.birthPlace
      if (data?.deathPlace) existing.deathPlace = data.deathPlace
      if (data?.biography) existing.biography = data.biography
      if (data?.photo) existing.photo = data.photo
      if (data?.ocupacion) existing.ocupacion = data.ocupacion
      if (data?.religion) existing.religion = data.religion
      if (data?.notas) existing.notas = data.notas
      this.saveToStorage()
      return existing
    }

    const member: FamilyMember = {
      id: generateId(),
      nombre,
      genero,
      birthDate: data?.birthDate || '',
      deathDate: data?.deathDate || '',
      birthPlace: data?.birthPlace || '',
      deathPlace: data?.deathPlace || '',
      biography: data?.biography || '',
      photo: data?.photo || '',
      ocupacion: data?.ocupacion || '',
      religion: data?.religion || '',
      notas: data?.notas || '',
      padres: [],
      hijos: [],
      hermanos: [],
      esposos: [],
      abuelos: [],
      bisabuelos: [],
      tipoPadre: {},
      estadoMatrimonio: {},
      divorceDate: {}
    }

    this.members[nombre] = member
    this.saveToStorage()
    return member
  }

  getMemberByIndex(index: number): FamilyMember | undefined {
    return Object.values(this.members)[index]
  }

  validateRelation(persona1: string, persona2: string, tipo: RelationType): void {
    if (persona1 === persona2) {
      throw new Error('No puedes ser tu propia pareja o relación')
    }

    if (this._isDescendantOf(persona1, persona2)) {
      throw new Error(`${persona1} es descendiente de ${persona2}. Relación inválida.`)
    }

    if (['padre', 'hijo', 'abuelo', 'bisabuelo'].includes(tipo)) {
      if (this._isDescendantOf(persona2, persona1)) {
        throw new Error(`${persona2} es descendiente de ${persona1}. Relación inválida.`)
      }
    }
  }

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

  addRelation(
    nombre: string,
    personaRelacionada: string,
    tipoRelacion: RelationType,
    parentType?: ParentType
  ): void {
    const m1 = this.addMember(nombre)
    const m2 = this.addMember(personaRelacionada)

    this.validateRelation(nombre, personaRelacionada, tipoRelacion)

    switch (tipoRelacion) {
      case 'padre':
        if (!m2.padres.includes(nombre)) {
          m2.padres.push(nombre)
        }
        if (parentType) {
          m2.tipoPadre[nombre] = parentType
        } else if (!m2.tipoPadre[nombre]) {
          m2.tipoPadre[nombre] = 'biologico'
        }
        if (!m1.hijos.includes(personaRelacionada)) {
          m1.hijos.push(personaRelacionada)
        }
        this._updateHermanos(m1.hijos)
        this._updateAbuelos(personaRelacionada)
        break

      case 'hijo':
        if (!m1.padres.includes(personaRelacionada)) {
          m1.padres.push(personaRelacionada)
        }
        if (parentType) {
          m1.tipoPadre[personaRelacionada] = parentType
        }
        if (!m2.hijos.includes(nombre)) {
          m2.hijos.push(nombre)
        }
        this._updateHermanos(m2.hijos)
        this._updateAbuelos(nombre)
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
        if (!m1.estadoMatrimonio[personaRelacionada]) {
          m1.estadoMatrimonio[personaRelacionada] = 'casado'
        }
        if (!m2.estadoMatrimonio[nombre]) {
          m2.estadoMatrimonio[nombre] = 'casado'
        }
        break

      case 'abuelo':
        if (!m2.hijos.includes(nombre)) {
          m2.hijos.push(nombre)
        }
        if (!m1.padres.includes(personaRelacionada)) {
          m1.padres.push(personaRelacionada)
        }
        if (parentType) {
          m1.tipoPadre[personaRelacionada] = parentType
        }
        this._updateAbuelos(nombre)
        break

      case 'bisabuelo':
        if (!m2.hijos.includes(nombre)) {
          m2.hijos.push(nombre)
        }
        if (!m1.padres.includes(personaRelacionada)) {
          m1.padres.push(personaRelacionada)
        }
        if (parentType) {
          m1.tipoPadre[personaRelacionada] = parentType
        }
        this._updateAbuelos(nombre)
        break
    }
    this.saveToStorage()
  }

  removeRelation(nombre: string, personaRelacionada: string, tipoRelacion: RelationType): void {
    const m1 = this.members[nombre]
    const m2 = this.members[personaRelacionada]
    if (!m1 || !m2) throw new Error('Una de las personas no existe')

    switch (tipoRelacion) {
      case 'padre':
        m2.padres = m2.padres.filter(p => p !== nombre)
        m1.hijos = m1.hijos.filter(h => h !== personaRelacionada)
        delete m2.tipoPadre[nombre]
        this._updateHermanos(m1.hijos)
        break
      case 'hijo':
        m1.padres = m1.padres.filter(p => p !== personaRelacionada)
        m2.hijos = m2.hijos.filter(h => h !== nombre)
        delete m1.tipoPadre[personaRelacionada]
        this._updateHermanos(m2.hijos)
        break
      case 'hermano':
        for (const h of [m1, m2]) {
          const targets = tipoRelacion === 'hermano'
            ? [nombre, personaRelacionada]
            : []
          h.hermanos = h.hermanos.filter(hh => hh !== (h === m1 ? personaRelacionada : nombre))
        }
        const allSiblings = new Set([...m1.hermanos, nombre, ...m2.hermanos, personaRelacionada])
        for (const s1 of allSiblings) {
          const s1m = this.members[s1]
          if (s1m) {
            s1m.hermanos = s1m.hermanos.filter(hh => hh !== (s1 === nombre ? personaRelacionada : nombre))
          }
        }
        break
      case 'esposo':
        m1.esposos = m1.esposos.filter(e => e !== personaRelacionada)
        m2.esposos = m2.esposos.filter(e => e !== nombre)
        delete m1.estadoMatrimonio[personaRelacionada]
        delete m2.estadoMatrimonio[nombre]
        delete m1.divorceDate[personaRelacionada]
        delete m2.divorceDate[nombre]
        break
    }
    this.saveToStorage()
  }

  setMarriageStatus(nombre: string, con: string, estado: MarriageStatus, divorceDate?: string): void {
    const m = this.members[nombre]
    const p = this.members[con]
    if (!m || !p) throw new Error('Persona no encontrada')
    m.estadoMatrimonio[con] = estado
    p.estadoMatrimonio[nombre] = estado
    if (divorceDate) {
      m.divorceDate[con] = divorceDate
      p.divorceDate[nombre] = divorceDate
    } else if (estado !== 'divorciado') {
      delete m.divorceDate[con]
      delete p.divorceDate[nombre]
    }
    this.saveToStorage()
  }

  setParentType(hijo: string, padre: string, tipo: ParentType): void {
    const h = this.members[hijo]
    if (!h) throw new Error('Persona no encontrada')
    h.tipoPadre[padre] = tipo
    this.saveToStorage()
  }

  private _updateHermanos(hermanos: string[]): void {
    for (const h1 of hermanos) {
      for (const h2 of hermanos) {
        if (h1 !== h2 && !this.members[h1].hermanos.includes(h2)) {
          this.members[h1].hermanos.push(h2)
        }
      }
    }
  }

  private _updateAbuelos(personaNombre: string): void {
    const persona = this.members[personaNombre]
    const nuevosAbuelos = new Set<string>()
    const nuevosBisabuelos = new Set<string>()

    for (const padre of persona.padres) {
      const padreData = this.members[padre]
      if (padreData) {
        for (const abuelo of padreData.padres) {
          nuevosAbuelos.add(abuelo)
        }
        for (const bisabuelo of padreData.abuelos) {
          nuevosBisabuelos.add(bisabuelo)
        }
      }
    }

    persona.abuelos = Array.from(nuevosAbuelos)
    persona.bisabuelos = Array.from(nuevosBisabuelos)
  }

  removeMember(nombre: string): void {
    if (!this.members[nombre]) {
      throw new Error(`${nombre} no existe en el árbol`)
    }

    const member = this.members[nombre]

    member.padres.forEach(padre => {
      const p = this.members[padre]
      if (p) p.hijos = p.hijos.filter(h => h !== nombre)
    })

    member.hijos.forEach(hijo => {
      const h = this.members[hijo]
      if (h) {
        h.padres = h.padres.filter(p => p !== nombre)
        delete h.tipoPadre[nombre]
      }
    })

    member.hermanos.forEach(hermano => {
      const h = this.members[hermano]
      if (h) h.hermanos = h.hermanos.filter(hm => hm !== nombre)
    })

    member.esposos.forEach(esposo => {
      const e = this.members[esposo]
      if (e) {
        e.esposos = e.esposos.filter(es => es !== nombre)
        delete e.estadoMatrimonio[nombre]
        delete e.divorceDate[nombre]
      }
    })

    delete this.members[nombre]
    this.saveToStorage()
  }

  saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.members))
    }
  }

  loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(this.storageKey)
      if (data) {
        this.members = JSON.parse(data)
        this._migrateMembers()
      }
    }
  }

  private _migrateMembers(): void {
    for (const member of Object.values(this.members)) {
      if (!member.id) member.id = generateId()
      if (member.birthDate === undefined) member.birthDate = ''
      if (member.deathDate === undefined) member.deathDate = ''
      if (member.birthPlace === undefined) member.birthPlace = ''
      if (member.deathPlace === undefined) member.deathPlace = ''
      if (member.biography === undefined) member.biography = ''
      if (member.photo === undefined) member.photo = ''
      if (member.ocupacion === undefined) member.ocupacion = ''
      if (member.religion === undefined) member.religion = ''
      if (member.notas === undefined) member.notas = ''
      if (!member.tipoPadre) member.tipoPadre = {}
      if (!member.estadoMatrimonio) member.estadoMatrimonio = {}
      if (!member.divorceDate) member.divorceDate = {}
    }
  }

  getAllMembers(): FamilyMember[] {
    return Object.values(this.members)
  }

  getMember(nombre: string): FamilyMember | undefined {
    return this.members[nombre]
  }

  getRoot(): FamilyMember | null {
    for (const member of Object.values(this.members)) {
      if (member.padres.length === 0) {
        return member
      }
    }
    return null
  }

  toJSON(): Members {
    return this.members
  }

  fromJSON(data: Members): void {
    this.members = { ...data }
    this._migrateMembers()
  }

  toGEDCOM(): string {
    const lines: string[] = []
    const members = Object.values(this.members)
    const d = new Date()
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    const today = `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`

    lines.push('0 HEAD')
    lines.push('1 SOUR ARBOLGENEALOGICO')
    lines.push('2 NAME Árbol Genealógico')
    lines.push('2 VERS 2.0.0')
    lines.push('1 GEDC')
    lines.push('2 VERS 5.5.5')
    lines.push('2 FORM LINEAGE-LINKED')
    lines.push('1 CHAR UTF-8')
    lines.push(`1 DATE ${today}`)

    const indiIds = new Map<string, string>()
    members.forEach((m, i) => {
      const id = `I${i + 1}`
      indiIds.set(m.nombre, id)
      lines.push(`0 @${id}@ INDI`)
      lines.push(`1 NAME ${m.nombre} /`)
      const sex = m.genero === 'hombre' ? 'M' : m.genero === 'mujer' ? 'F' : 'X'
      lines.push(`1 SEX ${sex}`)
      if (m.ocupacion) lines.push(`1 OCCU ${m.ocupacion}`)
      if (m.religion) lines.push(`1 RELI ${m.religion}`)
      if (m.notas) lines.push(`1 NOTE ${m.notas}`)
      if (m.birthDate) {
        lines.push('1 BIRT')
        lines.push(`2 DATE ${m.birthDate}`)
      }
      if (m.birthPlace) {
        if (!m.birthDate) lines.push('1 BIRT')
        lines.push(`2 PLAC ${m.birthPlace}`)
      }
      if (m.deathDate) {
        lines.push('1 DEAT')
        lines.push(`2 DATE ${m.deathDate}`)
      }
      if (m.deathPlace) {
        if (!m.deathDate) lines.push('1 DEAT')
        lines.push(`2 PLAC ${m.deathPlace}`)
      }
    })

    let famIdx = 0
    for (const m of members) {
      for (const esposo of m.esposos) {
        if (esposo > m.nombre) {
          famIdx++
          const fid = `F${famIdx}`
          const hid = indiIds.get(m.nombre)
          const wid = indiIds.get(esposo)
          lines.push(`0 @${fid}@ FAM`)
          if (hid) lines.push(`1 HUSB @${hid}@`)
          if (wid) lines.push(`1 WIFE @${wid}@`)
          const estado = m.estadoMatrimonio?.[esposo]
          if (estado && estado !== 'casado') {
            lines.push(`1 STATUS ${estado.toUpperCase()}`)
            const dd = m.divorceDate?.[esposo]
            if (dd) lines.push(`2 DATE ${dd}`)
          }
          const children = members.filter(c => c.padres.includes(m.nombre) && c.padres.includes(esposo))
          for (const child of children) {
            const cid = indiIds.get(child.nombre)
            if (cid) {
              lines.push(`1 CHIL @${cid}@`)
              const pt = child.tipoPadre?.[m.nombre]
              if (pt && pt !== 'biologico') {
                lines.push(`2 PEDI ${pt.toUpperCase()}`)
              }
            }
          }
        }
      }
    }

    lines.push('0 TRLR')
    return lines.join('\n')
  }

  fromGEDCOM(gedcom: string): void {
    const lines = gedcom.split('\n')
    const indiMap = new Map<string, {
      id: string; nombre: string; genero: Gender;
      birthDate: string; deathDate: string;
      birthPlace: string; deathPlace: string;
      ocupacion: string; religion: string; notas: string
    }>()
    const famMap = new Map<string, {
      husb?: string; wife?: string; chils: { id: string; pedi?: string }[]
    }>()
    let currentId = ''
    let currentType = ''
    let currentEvent = ''
    let currentPedi = ''

    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(?:@(\w+)@\s+)?(\w+)(?:\s+(.+))?$/)
      if (!match) continue
      const level = parseInt(match[1])
      const id = match[2] || ''
      const tag = match[3]
      const value = match[4] || ''

      if (level === 0) {
        if (tag === 'INDI' && id) {
          currentType = 'INDI'
          currentId = id
          indiMap.set(id, { id, nombre: '', genero: 'otro', birthDate: '', deathDate: '', birthPlace: '', deathPlace: '', ocupacion: '', religion: '', notas: '' })
        } else if (tag === 'FAM' && id) {
          currentType = 'FAM'
          currentId = id
          famMap.set(id, { chils: [] })
        } else {
          currentType = ''
        }
        currentEvent = ''
        currentPedi = ''
      } else if (level === 1) {
        if (currentType === 'INDI') {
          const indi = indiMap.get(currentId)
          if (indi) {
            if (tag === 'NAME') {
              indi.nombre = value.replace(/\s*\/.*$/, '').trim()
            } else if (tag === 'SEX') {
              indi.genero = value === 'M' ? 'hombre' : value === 'F' ? 'mujer' : 'otro'
            } else if (tag === 'BIRT') {
              currentEvent = 'BIRT'
            } else if (tag === 'DEAT') {
              currentEvent = 'DEAT'
            } else if (tag === 'OCCU') {
              indi.ocupacion = value
            } else if (tag === 'RELI') {
              indi.religion = value
            } else if (tag === 'NOTE') {
              indi.notas = value
            } else {
              currentEvent = ''
            }
          }
        } else if (currentType === 'FAM') {
          const fam = famMap.get(currentId)
          if (fam) {
            if (tag === 'HUSB') fam.husb = value.replace(/@/g, '').trim()
            else if (tag === 'WIFE') fam.wife = value.replace(/@/g, '').trim()
            else if (tag === 'CHIL') {
              const childId = value.replace(/@/g, '').trim()
              fam.chils.push({ id: childId, pedi: undefined })
              currentPedi = childId
            }
          }
        }
      } else if (level === 2) {
        if (currentType === 'INDI') {
          const indi = indiMap.get(currentId)
          if (indi) {
            if (tag === 'DATE') {
              if (currentEvent === 'BIRT') indi.birthDate = value
              else if (currentEvent === 'DEAT') indi.deathDate = value
            } else if (tag === 'PLAC') {
              if (currentEvent === 'BIRT') indi.birthPlace = value
              else if (currentEvent === 'DEAT') indi.deathPlace = value
            }
          }
        } else if (currentType === 'FAM' && tag === 'PEDI') {
          const fam = famMap.get(currentId)
          if (fam && fam.chils.length > 0) {
            const last = fam.chils[fam.chils.length - 1]
            last.pedi = value.toLowerCase()
          }
        }
      }
    }

    this.members = {}

    for (const [, indi] of indiMap) {
      if (indi.nombre) {
        this.addMember(indi.nombre, indi.genero, {
          birthDate: indi.birthDate,
          deathDate: indi.deathDate,
          birthPlace: indi.birthPlace,
          deathPlace: indi.deathPlace,
          ocupacion: indi.ocupacion,
          religion: indi.religion,
          notas: indi.notas
        })
      }
    }

    for (const [, fam] of famMap) {
      const husbName = fam.husb ? indiMap.get(fam.husb)?.nombre : undefined
      const wifeName = fam.wife ? indiMap.get(fam.wife)?.nombre : undefined

      if (husbName && wifeName) {
        this.addRelation(husbName, wifeName, 'esposo')
      }

      for (const childRef of fam.chils) {
        const childName = indiMap.get(childRef.id)?.nombre
        if (childName) {
          if (husbName && this.members[husbName]) {
            this.addRelation(husbName, childName, 'padre', childRef.pedi as ParentType)
          }
          if (wifeName && this.members[wifeName]) {
            this.addRelation(wifeName, childName, 'padre', childRef.pedi as ParentType)
          }
        }
      }
    }

    this.saveToStorage()
  }

  getMarriageStatus(nombre: string, con: string): MarriageStatus {
    return this.members[nombre]?.estadoMatrimonio?.[con] || 'casado'
  }

  getParentType(hijo: string, padre: string): ParentType {
    return this.members[hijo]?.tipoPadre?.[padre] || 'biologico'
  }
}

export default FamilyTree
