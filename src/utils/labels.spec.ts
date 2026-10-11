import { describe, it, expect } from 'vitest';
import {
  childRoleLabel,
  genderLabel,
  isBiological,
  parentRoleLabel,
  relationshipTypeLabel,
} from '@/utils/labels';

describe('labels', () => {
  it('traduce los géneros al español', () => {
    expect(genderLabel('male')).toBe('Masculino');
    expect(genderLabel('female')).toBe('Femenino');
    expect(genderLabel('other')).toBe('Otro');
    expect(genderLabel('unknown')).toBe('Desconocido');
    expect(genderLabel(undefined)).toBe('—');
  });

  it('traduce los tipos de relación al español', () => {
    expect(relationshipTypeLabel('parent_child')).toBe('biológico');
    expect(relationshipTypeLabel('adoptive')).toBe('adoptivo');
    expect(relationshipTypeLabel('step_parent')).toBe('padrastro/madrastra');
    expect(relationshipTypeLabel('spouse')).toBe('pareja');
    expect(relationshipTypeLabel('partner')).toBe('pareja');
  });

  it('usa la etiqueta correcta según la perspectiva', () => {
    expect(parentRoleLabel('step_parent')).toBe('padrastro/madrastra');
    expect(childRoleLabel('step_parent')).toBe('hijastro/a');
    expect(parentRoleLabel('adoptive')).toBe('adoptivo');
    expect(childRoleLabel('adoptive')).toBe('adoptivo');
  });

  it('detecta los vínculos biológicos', () => {
    expect(isBiological('parent_child')).toBe(true);
    expect(isBiological('step_parent')).toBe(false);
    expect(isBiological('adoptive')).toBe(false);
  });
});
