<template>
  <div class="unpack">
    <a-textarea placeholder="BKV" :rows="4" v-model="bkvHex" @keyup.native="parse" @change="parse" @blur="parse" />
    <a-divider>UNPACK RESULT</a-divider>
    <a-table :columns="columns"
      :rowKey="record => record.index"
      :dataSource="data"
      :pagination="false"
    />
  </div>
</template>

<script>

import BKV from '../core/bkv'

const columns = [
  {
    title: 'KEY LEN',
    dataIndex: 'key_len',
    width: '100px',
  }, 
  {
    title: 'KEY TYPE',
    dataIndex: 'key_type',
    width: '100px',
  },    
  {
    title: 'KEY',
    dataIndex: 'key',
    width: '200px',
  }, 
  {
    title: 'VALUE(HEX)',
    dataIndex: 'value',
  }];

export default {
  name: 'unpack',
  data() {
    return {
      bkvHex: '040130fc19040137000304013b000902015408017c112233445566070170312e302e31',
      data: [],
      columns,
    }
  },
  mounted: function() {
    console.log(this.bkvHex);
    this.parse();
  },
  methods: {
    parse() {
      this.data = [];
      if (this.bkvHex === '') {
        return;
      };
      let result = BKV.BKV.unpack(BKV.hexToBuffer(this.bkvHex));
      console.log('parse result', result);
      if (result.code !== 0) {
        return;
      }
      let bkv = result.bkv;
      let items = bkv.items();
      for (let i in items) {
          let item = items[i];
          console.log(item);
          let key = item.key();
          if (!item.isStringKey()) {
            key = '0x' + key.toString(16).toUpperCase();
          }
          this.data.push({
            key: key,
            key_len: item.keyLength(),
            key_type: item.isStringKey() ? 'STRING' : 'NUMBER',
            value: BKV.bufferToHex(item.value()).toUpperCase()
          });
      }
      console.log(this.data);
      
    }
  }
}
</script>

<style scoped lang="scss">
    .unpack {
        /*padding: 20px;*/

        width: 720px;
        margin: auto;

        .ant-table-thead > tr > th, .ant-table-tbody > tr > td {
          font-family: Consolas, "Courier New", monospace;
          font-size: 14px;
          color: #333;
        }
    }
</style>

<style lang="scss">
  .ant-table-thead > tr > th, .ant-table-tbody > tr > td {
    // font-family: Consolas, "Courier New", monospace;
    // font-size: 14px;
    // color: #333;
  }
</style>