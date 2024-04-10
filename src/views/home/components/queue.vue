<template>
  <div class="queue">
    <div class="container-box">
      <div class="container-left">
        <div v-for="(item, index) in items" :key="index" class="box box-left"></div>
      </div>
      <div class="container-right">
        <div v-for="(item, index) in items" :key="index" class="box box-right"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  // @ts-ignore
  import anime from 'animejs';

  const items = ref(['1', '2', '3', '4', '5']);
  onMounted(() => {
    const boxLeft = document.querySelectorAll('.box-left');
    const boxRight = document.querySelectorAll('.box-right');
    anime({
      targets: boxLeft,
      translateX: '90%', // 将元素移动到中间
      opacity: 1, // 设置透明度为1
      delay: anime.stagger(300, { easing: 'easeOutQuad' }), // 使用stagger函数设置延迟
      easing: 'easeInOutQuad', // 使用easeInOutQuad作为缓动函数
    });
    anime({
      targets: boxRight,
      translateX: '-100%',
      opacity: 1,
      delay: anime.stagger(300, { easing: 'easeOutQuad' }),
      easing: 'easeInOutQuad',
    });
  });
</script>

<style lang="less" scoped>
  .queue {
    width: 100%;
    height: 100vh;
    background-image: url('../../../assets/images/home4.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    .container-box {
      display: flex;
      justify-content: space-between;
      .container {
        &-left {
          width: 25%;
          display: flex;
          flex-direction: column;
        }
        &-right {
          width: 25%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
      }
    }
  }

  .box {
    opacity: 0;
    width: 100%;
    height: 100px;
    background-color: rgba(255, 255, 255, 0.3);
    margin: 10px;
    text-align: center;
  }
</style>
