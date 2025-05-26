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
    return {
      keyList: [
        {key: 0x30, type: 'int16', permission: 'r', name: 'signalStrength',},
        {key: 0x31, type: 'int16', permission: 'r', name: 'linkQuality',},
        {key: 0x32, type: 'int8', permission: 'r', name: 'signalECL',},
        {key: 0x33, type: 'int32', permission: 'r', name: 'signalCellID',},
        {key: 0x34, type: 'int16', permission: 'r', name: 'signalPCI',},
        {key: 0x36, type: 'uint16', permission: 'r', name: 'signalEar',},
        {key: 0x37, type: 'uint16', permission: 'r', name: 'NB重启次数',},
        {key: 0x38, type: 'uint16', permission: 'r', name: 'MCU复位次数',},
        {key: 0x39, type: 'uint8', permission: 'r', name: '设备状态',},
        {key: 0x3A, type: 'uint8', permission: 'r', name: '电池电量',},
        {key: 0x3B, type: 'uint16', permission: 'r', name: '设备上线时间',},
        {key: 0x3C, type: 'uint8', permission: 'r', name: '重启寄存器',},

        {key: 0x50, type: 'uint8', permission: 'w', name: '触发校准',},
        {key: 0x51, type: 'uint8', permission: 'w', name: '触发心跳',},
        {key: 0x52, type: 'uint8', permission: 'w', name: '触发MCU重启',},
        {key: 0x53, type: 'uint8', permission: 'w', name: '触发NB模组重启',},
        {key: 0x54, type: 'uint8', permission: 'w', name: '触发睡眠',},
        {key: 0x55, type: 'uint8', permission: 'w', name: '清空自动校准缓存',},
        {key: 0x56, type: 'uint8', permission: 'w', name: '自动校准参数出厂恢复',},
        {key: 0x57, type: 'uint8', permission: 'w', name: '设备恢复出厂设置',},

        {key: 0x70, type: 'string', permission: 'r', name: 'MCU硬件版本',},
        {key: 0x71, type: 'string', permission: 'r', name: 'MCU软件版本',},
        {key: 0x72, type: 'string', permission: 'r', name: '生产信息',},

        {key: 0x73, type: 'uint8', permission: 'rw', name: '应用场景',},
        {key: 0x78, type: 'uint16', permission: 'rw', name: '心跳时间',},
        {key: 0x79, type: 'uint8', permission: 'rw', name: '波特率',},
        {key: 0x7C, type: 'hex', permission: 'r', name: '蓝牙MAC',},

        {key: 0x7A, type: 'string', permission: 'r', name: 'IMSI',},
        {key: 0x7B, type: 'string', permission: 'r', name: 'NCCID',},
        {key: 0x7F, type: 'string', permission: 'r', name: 'NB硬件版本',},
        {key: 0x80, type: 'string', permission: 'r', name: 'NB软件版本',},
        {key: 0x81, type: 'string', permission: 'r', name: 'nband',},
        {key: 0x82, type: 'string', permission: 'r', name: 'APN_net',},
        {key: 0x83, type: 'string', permission: 'r', name: 'TAU_net',},
      ],
    }
  }
}
</script>

<style scoped lang="scss">
.pack .bkv-editor-holder {
  /*padding: 20px;*/

  width: 720px;
  margin: auto;
}
</style>
