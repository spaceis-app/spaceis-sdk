<script setup lang="ts">
const { toasts } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <Transition
        v-for="toast in toasts"
        :key="toast.id"
        name="toast"
        appear
      >
        <div :class="['toast', `toast-${toast.type}`]">
          {{ toast.message }}
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
}

.toast {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: #fff;
  background: var(--bg-2, #333);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #16a34a;
}

.toast-error {
  background: #dc2626;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
