export type Gender = 'male' | 'female' | 'nonbinary' | 'other' | 'unknown';

// Situación de quienes no llegaron a nacer (hermanos "no nacidos").
export type NonBornStatus = 'miscarriage' | 'abortion' | 'stillborn';

export type RelationshipType =
  | 'parent_child'
  | 'spouse'
  | 'adoptive'
  | 'step_parent'
  | 'partner';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  occupation?: string;
  religion?: string;
  photoUrl?: string;
  notes?: string;
  generation?: number;
  // No nacido: cuenta en el orden de la hermandad (A.E, A.P, N.N).
  nonBorn?: NonBornStatus;
  // Causa de muerte en texto libre; se deriva el marcador (C.A, S...).
  deathCause?: string;
  // Marcador de abuso / manoseo en el genograma.
  abuse?: boolean;
  // Fecha de concepción (para el orden de hermanos cuando se conoce).
  conceptionDate?: string;
  metadata?: {
    certifications?: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface Relationship {
  id: string;
  personId1: string; // Progenitor o Cónyuge A
  personId2: string; // Descendiente o Cónyuge B
  type: RelationshipType;
  marriageDate?: string;
  divorceDate?: string;
  notes?: string;
  isBiological?: boolean;
}

export interface TreeData {
  id: string;
  name: string;
  rootPersonId: string;
  members: Record<string, Person>;
  relationships: Relationship[];
  createdAt: string;
  selectedPersonId?: string;
}
