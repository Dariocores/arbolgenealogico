<template>
  <div class="license-view">
    <div class="license-card">
      <h2>Tu cuenta está inactiva</h2>
      <p class="license-sub">
        Para acceder a tu árbol en la nube necesitás una licencia vigente.
        Escribinos para activarla o renovarla.
      </p>

      <div class="details">
        <div class="detail-row">
          <span class="label">Cuenta</span>
          <span>{{ auth.email ?? '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Vence</span>
          <span>{{ formattedUntil }}</span>
        </div>
      </div>

      <a
        class="btn btn-primary"
        href="mailto:contacto@ejemplo.com?subject=Activar%20licencia"
      >
        Solicitar activación
      </a>
      <button class="logout" type="button" @click="onLogout">Cerrar sesión</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const formattedUntil = computed(() => {
  const value = auth.profile?.license_until;
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

async function onLogout(): Promise<void> {
  await auth.signOut();
  await router.push('/ingresar');
}
</script>

<style scoped>
.license-view {
  display: flex;
  justify-content: center;
  padding: 48px 20px;
}

.license-card {
  width: 100%;
  max-width: 460px;
  padding: 28px;
  background: var(--card);
  color: var(--card-text);
  border: 1px solid var(--border);
  border-radius: 14px;
  text-align: center;
}

.license-card h2 {
  margin-bottom: 8px;
}

.license-sub {
  color: var(--muted);
  font-size: 0.92em;
  margin-bottom: 20px;
}

.details {
  text-align: left;
  margin-bottom: 22px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.92em;
}

.detail-row .label {
  color: var(--muted);
}

.btn {
  display: inline-block;
  padding: 11px 18px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: var(--on-primary, #fff);
}

.logout {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 8px;
  background: none;
  border: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.9em;
  cursor: pointer;
}
</style>
