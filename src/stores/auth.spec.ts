import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore, type Profile } from '@/stores/auth';

function profile(overrides: Partial<Profile>): Profile {
  return {
    id: 'u1',
    email: 'user@test.com',
    role: 'user',
    license_active: false,
    license_until: null,
    ...overrides,
  };
}

describe('auth store — licencia', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('el admin siempre tiene licencia activa', () => {
    const auth = useAuthStore();
    auth.profile = profile({ role: 'admin', license_active: false });
    expect(auth.hasActiveLicense).toBe(true);
  });

  it('sin perfil no hay licencia', () => {
    const auth = useAuthStore();
    auth.profile = null;
    expect(auth.hasActiveLicense).toBe(false);
  });

  it('usuario con licencia activa sin vencimiento', () => {
    const auth = useAuthStore();
    auth.profile = profile({ license_active: true, license_until: null });
    expect(auth.hasActiveLicense).toBe(true);
  });

  it('usuario con licencia desactivada no accede', () => {
    const auth = useAuthStore();
    auth.profile = profile({ license_active: false });
    expect(auth.hasActiveLicense).toBe(false);
  });

  it('usuario con licencia vencida no accede', () => {
    const auth = useAuthStore();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    auth.profile = profile({ license_active: true, license_until: past });
    expect(auth.hasActiveLicense).toBe(false);
  });

  it('usuario con licencia vigente accede', () => {
    const auth = useAuthStore();
    const future = new Date(Date.now() + 86_400_000).toISOString();
    auth.profile = profile({ license_active: true, license_until: future });
    expect(auth.hasActiveLicense).toBe(true);
  });
});
