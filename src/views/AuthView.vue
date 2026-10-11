<template>
  <div class="auth-view">
    <div class="auth-card">
      <h2>{{ mode === 'login' ? 'Ingresar' : 'Crear cuenta' }}</h2>
      <p class="auth-sub">
        {{
          mode === 'login'
            ? 'Accedé a tu árbol guardado en la nube.'
            : 'Registrate para guardar tu árbol y acceder desde cualquier dispositivo.'
        }}
      </p>

      <div v-if="!auth.isConfigured" class="notice">
        El modo nube no está configurado. Definí
        <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
      </div>

      <form v-else class="auth-form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Correo electrónico</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            :disabled="auth.loading"
          />
        </label>

        <label class="field">
          <span>Contraseña</span>
          <input
            v-model="form.password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            minlength="6"
            required
            :disabled="auth.loading"
          />
        </label>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p v-if="infoMessage" class="info">{{ infoMessage }}</p>

        <button type="submit" class="btn btn-primary" :disabled="auth.loading">
          {{ auth.loading ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta' }}
        </button>
      </form>

      <button class="switch" type="button" @click="toggleMode">
        {{
          mode === 'login'
            ? '¿No tenés cuenta? Crear una'
            : '¿Ya tenés cuenta? Ingresar'
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const mode = ref<'login' | 'register'>('login');
const form = reactive({ email: '', password: '' });
const errorMessage = ref('');
const infoMessage = ref('');

function toggleMode(): void {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  errorMessage.value = '';
  infoMessage.value = '';
}

async function onSubmit(): Promise<void> {
  errorMessage.value = '';
  infoMessage.value = '';
  try {
    if (mode.value === 'login') {
      await auth.signIn(form.email, form.password);
      await router.push('/inicio');
    } else {
      const { needsConfirmation } = await auth.signUp(form.email, form.password);
      if (needsConfirmation) {
        infoMessage.value =
          'Te enviamos un correo para confirmar la cuenta. Revisá tu bandeja.';
      } else {
        await router.push('/inicio');
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ocurrió un error.';
  }
}
</script>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  padding: 48px 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 28px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 14px;
}

.auth-card h2 {
  margin-bottom: 6px;
}

.auth-sub {
  color: var(--muted);
  font-size: 0.9em;
  margin-bottom: 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9em;
  font-weight: 600;
}

.field input {
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
}

.btn {
  padding: 11px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: var(--on-primary, #fff);
}

.btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.switch {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 8px;
  background: none;
  border: none;
  color: var(--primary);
  font: inherit;
  font-size: 0.9em;
  cursor: pointer;
}

.error {
  color: var(--danger);
  font-size: 0.88em;
}

.info {
  color: var(--primary);
  font-size: 0.88em;
}

.notice {
  padding: 12px 14px;
  background: var(--border);
  border-radius: 8px;
  font-size: 0.88em;
  line-height: 1.5;
}

.notice code {
  font-family: monospace;
  font-size: 0.95em;
}
</style>
