<script setup lang="ts">
import { onMounted, ref } from "vue"
import { Live2d } from '../ts/live2d'


let live2d: any = null
onMounted(() => {
  live2d = new Live2d({
    resourcesPath: 'https://www.jawei.icu/live2d/model/',
    modelDirs: ['Hiyori', 'dafeng_2', 'whitecat']
  })
  console.debug(live2d);
})

const changeModel = () => {
  console.debug(live2d.App.live2DManager);
  live2d.nextModel()
}

const changeMotion =()=>{
  live2d.changeMotion()
}
</script>

<template>
  <div class="live2d">
    <canvas id="live2d" width="1080" height="1050" class="live2d"></canvas>
    <div class="tool">
      <span class="fui-home"></span>
      <span class="fui-chat"></span>
      <span class="fui-eye"></span>
      <span class="fui-user"></span>
      <span class="fui-photo"></span>
      <span class="fui-info-circle"></span>
      <span class="fui-cross"></span>
    </div>
  </div>
  <div class="btns">
    <button @click="changeModel">切换模型</button>
    <button @click="changeMotion">切换动作</button>
  </div>
</template>

<style scoped>
.live2d {
  position: fixed;
  top: 0;
  left: 0;
  border: 1px solid #Fff;
}

.btns {
  position: fixed;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>