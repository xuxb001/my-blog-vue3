<template>
  <div class="matrix-box max-w-5xl px-4 mx-auto pb-22 sm:px-6 md:px-8 xl:px-12 xl:max-w-6xl">
    <div v-for="(item, index) in items" :key="index" class="matrix-items"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  // @ts-ignore
  import anime from 'animejs';

  const items = ref(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']);
  onMounted(() => {
    const matrixItems = document.querySelectorAll('.matrix-items');
    anime({
      targets: matrixItems, // 选择要应用动画的元素
      translateX: anime.stagger(50, { grid: [4, 4], from: 'center', axis: 'x' }),
      translateY: anime.stagger(50, { grid: [4, 4], from: 'center', axis: 'y' }),
      delay: anime.stagger(200, { grid: [4, 4], from: 'center' }),
      easing: 'easeInOutQuad',
    });
  });
</script>

<style lang="less" scoped>
  .matrix-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    .matrix-items {
      width: 25%;
      height: 100px;
      background-color: #ccc;
      // opacity: 0;
      transition: all 0.5s ease-in-out;
      &:nth-child(2n) {
        background-color: #f00;
      }
      &:nth-child(3n) {
        background-color: #0f0;
      }
    }
  }
</style>
