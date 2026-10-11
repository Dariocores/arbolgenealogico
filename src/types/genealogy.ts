export type Gender = 'male' | 'female' | 'other' | 'unknown';

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
