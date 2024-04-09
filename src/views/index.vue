<template>
  <div class="app-blog">
    <Header />
    <Home />
  </div>
</template>

<script setup lang="ts">
  import Header from '@/components/Header/index.vue';
  import Home from './home/index.vue';
</script>

<style lang="less" scoped>
  .app-blog {
    background-color: rgba(8, 31, 92, 1);
  }
</style>
