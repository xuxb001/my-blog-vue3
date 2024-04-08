<template>
  <div class="dark:text-slate-400 dark:bg-slate-900">
    <Header />
    <main class="max-w-5xl px-4 mx-auto pb-22 sm:px-6 md:px-8 xl:px-12 xl:max-w-6xl carousel-box">
      <div ref="listRef" class="carousel-list">
        <div v-for="(el, index) in data" :key="index" class="carousel-item" @mousemove="eover()" @mouseout="eout">
          <div class="card-header">
            <span>{{ el.title }}</span>
          </div>
          <div class="content_area">
            <el-image style="width: 100px; height: 100px" :src="el.avatar" :fit="fit" />
            <p class="text item">{{ el.content }}</p>
          </div>
          <div class="footer">
            <div>{{ el.date }}</div>
            <div class="icon_status">
              <div class="interaction">
                <el-icon><View /></el-icon>{{ el.view }}
              </div>
              <div class="interaction">
                <el-icon><ChatDotSquare /></el-icon>{{ el.chatDotSquare }}
              </div>
              <div class="interaction">
                <el-icon><Pointer /></el-icon>{{ el.pointer }}
              </div>
              <div class="interaction">
                <el-icon><Star /></el-icon>{{ el.star }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  // import SvgIcon from '@/components/SvgIcon/index.vue';
  import { framework } from './data';
  import Header from '@/components/Header/index.vue';

  // @ts-ignore
  import anime from 'animejs';

  const data = ref(framework);
  ///动画相关代码
  const listRef = ref();
  let spacing = 10; //模块之间的间距
  var animation = shallowRef<ReturnType<typeof anime>>(null);
  const init = () => {
    // 动画中所有模块实例对象集合
    const children = listRef.value?.children || [];

    //如果没有实例作拦截
    if (!children.length) return;

    // 获取列表集合中第一个元素宽，通过宽和元素之间的间距计算出移动距离firstDiff
    const firstEl = children[0] as HTMLElement;
    const firstDiff = firstEl.offsetWidth + spacing;

    // 默认将list元素向左移动一个item的距离
    listRef.value!.style.transform = `translateX(-${firstDiff + 40}px)`;

    const transList: any = [];
    let total = 0; //声明总宽
    // 设置初始位置
    anime.set(children, {
      ['translateX']: (el: HTMLElement, i: number) => {
        //计算得出总宽
        const distance = el.offsetWidth + spacing;
        total += distance;
        //设置初始运动点为0
        const diff = (i + 1) * distance;
        //收集所有小模块运动x轴点值
        transList[i] = { ['x']: diff };
        return diff;
      },
    });
    // 设置list容器的宽或高
    listRef.value!.style['width'] = total + 'px';

    // 添加动画
    animation.value = anime({
      targets: transList,
      duration: 50000, //一个动画时间
      easing: 'linear',
      direction: 'horizontal',
      ['x']: `+=${total}`,
      loop: true, //是否循环
      update: () => {
        anime.set(children, {
          ['translateX']: (_el: any, i: string | number) => {
            return transList[i]['x'] % total;
          },
        });
      },
    });
  };
  onMounted(() => {
    init();
  });
  //鼠标移入事件
  const eover = () => {
    animation.value.pause();
  };
  //鼠标移出事件
  const eout = () => {
    animation.value.play();
  };
</script>

<style lang="less" scoped>
  .carousel-box {
    padding-top: 20px;
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    .carousel-item {
      position: absolute;
      top: 0;
      left: 0;
      max-width: 480px;
      border-radius: 4px;
      // border: 1px solid #e4e7ed;
      background-color: rgba(255, 255, 255, 0.6);
      color: #303133;
      padding: 20px;
      cursor: pointer;
      .card-header {
        font-weight: 800;
      }
      .content_area {
        display: flex;
        justify-items: center;
        margin: 10px 0;
        .el-image {
          margin-right: 10px;
        }
        .text {
          width: calc(100% - 100px);
        }
      }
      .footer {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-top: 10px;
        .icon_status {
          display: flex;
        }
        .interaction {
          margin-right: 10px;
          display: flex;
          align-items: center;
          cursor: pointer;
          .el-icon {
            margin-right: 3px;
          }
        }
      }
    }
  }
</style>
