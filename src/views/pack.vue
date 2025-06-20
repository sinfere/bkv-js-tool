<template>
  <div class="pack">
    <bkv-editor class="bkv-editor-holder"/>
  </div>
</template>

<script>
// @ is an alias to /src
import bkvEditor from '@/components/bkv-editor.vue'

export default {
  name: 'pack',
  components: {
    bkvEditor
  },
  data: function () {
    return {}
  }
}
</script>

<style scoped lang="scss">
.pack .bkv-editor-holder {
  /*padding: 20px;*/
  width: 720px;
  max-width: 100%;
  margin: auto;
}
</style>
