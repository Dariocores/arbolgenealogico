import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { createPinia } from 'pinia';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

import App from '@/App.vue';
import router from '@/router/index';

describe('App (smoke)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-accent');
    localStorage.clear();
  });

  it('monta la app y renderiza el home', async () => {
    router.push('/inicio');
    await router.isReady();

    render(App, {
      global: { plugins: [createPinia(), router] },
    });

    expect(
      await screen.findByText(/Bienvenido al Árbol Genealógico/i),
    ).toBeTruthy();
  });

  it('cambia el acento y lo persiste', async () => {
    router.push('/inicio');
    await router.isReady();

    render(App, {
      global: { plugins: [createPinia(), router] },
    });

    expect(document.documentElement.dataset.accent).toBe('teal');

    await fireEvent.click(screen.getByLabelText(/cambiar tema de color/i));
    await fireEvent.click(screen.getByText('Naranja'));

    expect(document.documentElement.dataset.accent).toBe('orange');
    expect(localStorage.getItem('familyTree_v2_accent')).toBe('orange');
  });
});
