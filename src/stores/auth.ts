import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string | null;
  role: 'user' | 'admin';
  license_active: boolean;
  license_until: string | null;
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const profile = ref<Profile | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  const isConfigured = computed(() => isSupabaseConfigured);
  const isLoggedIn = computed(() => Boolean(session.value));
  const email = computed(() => session.value?.user.email ?? profile.value?.email ?? null);
  const isAdmin = computed(() => profile.value?.role === 'admin');
  const hasActiveLicense = computed(() => {
    if (!profile.value) return false;
    if (profile.value.role === 'admin') return true;
    if (!profile.value.license_active) return false;
    if (
      profile.value.license_until &&
      new Date(profile.value.license_until).getTime() <= Date.now()
    ) {
      return false;
    }
    return true;
  });

  async function loadProfile(): Promise<void> {
    if (!supabase || !session.value) {
      profile.value = null;
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role, license_active, license_until')
      .eq('id', session.value.user.id)
      .maybeSingle();
    profile.value = (data as Profile | null) ?? null;
  }

  async function init(): Promise<void> {
    if (initialized.value) return;
    if (!isSupabaseConfigured || !supabase) {
      initialized.value = true;
      return;
    }

    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    if (session.value) await loadProfile();

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession;
      if (nextSession) {
        void loadProfile();
      } else {
        profile.value = null;
      }
    });

    initialized.value = true;
  }

  async function ensureInit(): Promise<void> {
    if (!initialized.value) await init();
  }

  function translateError(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('email not confirmed')) return 'Tenés que confirmar tu correo antes de entrar.';
    if (msg.includes('user already registered')) return 'Ese correo ya está registrado.';
    if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('unable to validate email')) return 'El correo no es válido.';
    return message;
  }

  async function signIn(mail: string, password: string): Promise<void> {
    if (!supabase) throw new Error('El modo nube no está configurado.');
    loading.value = true;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) throw new Error(translateError(error.message));
      await loadProfile();
    } finally {
      loading.value = false;
    }
  }

  async function signUp(mail: string, password: string): Promise<{ needsConfirmation: boolean }> {
    if (!supabase) throw new Error('El modo nube no está configurado.');
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email: mail, password });
      if (error) throw new Error(translateError(error.message));
      const needsConfirmation = !data.session;
      if (data.session) await loadProfile();
      return { needsConfirmation };
    } finally {
      loading.value = false;
    }
  }

  async function signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
    session.value = null;
    profile.value = null;
  }

  return {
    session,
    profile,
    loading,
    initialized,
    isConfigured,
    isLoggedIn,
    isAdmin,
    email,
    hasActiveLicense,
    init,
    ensureInit,
    signIn,
    signUp,
    signOut,
  };
});
