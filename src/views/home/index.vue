<template>
  <div class="image-container">
    <Carousel />
  </div>

  <Queue />
  <Matrix />
</template>

<script setup lang="ts">
  import Carousel from './components/carousel.vue';
  import Queue from './components/queue.vue';
  import Matrix from './components/matrix.vue';

  import { onMounted } from 'vue';

  const images = [
    new URL('../../assets/images/home.jpg', import.meta.url).href,
    new URL('../../assets/images/home2.jpg', import.meta.url).href,
    new URL('../../assets/images/home3.jpg', import.meta.url).href,
  ];

  onMounted(() => {});
</script>

<style lang="less" scoped>
  .image-container {
    width: 100%;
    height: 100vh;
    background-image: url('../../assets/images/home.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
  }
</style>
