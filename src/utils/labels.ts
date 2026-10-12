import type { Gender, NonBornStatus, RelationshipType } from '@/types/genealogy';

const GENDER_LABELS: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Femenino',
  nonbinary: 'No binario',
  other: 'Otro',
  unknown: 'Desconocido',
};

export function genderLabel(gender: Gender | undefined): string {
  if (!gender) return '—';
  return GENDER_LABELS[gender] ?? 'Desconocido';
}

const NON_BORN_LABELS: Record<NonBornStatus, string> = {
  miscarriage: 'Aborto espontáneo (A.E)',
  abortion: 'Aborto provocado (A.P)',
  stillborn: 'No nacido/a (N.N)',
};

export function nonBornLabel(status: NonBornStatus | undefined): string {
  if (!status) return '—';
  return NON_BORN_LABELS[status] ?? '—';
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent_child: 'biológico',
  adoptive: 'adoptivo',
  step_parent: 'padrastro/madrastra',
  spouse: 'pareja',
  partner: 'pareja',
};

export function relationshipTypeLabel(type: RelationshipType): string {
  return RELATIONSHIP_LABELS[type] ?? type;
}

export function isBiological(type: RelationshipType): boolean {
  return type === 'parent_child';
}

export function parentRoleLabel(type: RelationshipType): string {
  switch (type) {
    case 'adoptive':
      return 'adoptivo';
    case 'step_parent':
      return 'padrastro/madrastra';
    default:
      return relationshipTypeLabel(type);
  }
}

export function childRoleLabel(type: RelationshipType): string {
  switch (type) {
    case 'adoptive':
      return 'adoptivo';
    case 'step_parent':
      return 'hijastro/a';
    default:
      return relationshipTypeLabel(type);
  }
}
