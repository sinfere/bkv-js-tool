<template>
  <div class="unpack">
    <a-textarea placeholder="BKV" :rows="4" v-model="bkvHex" @keyup.native="parse" @change="parse" @blur="parse"/>
    <div class="clear-10"></div>
    <div class="fr">
      <span class="mr-5">CUT START</span>
      <a-input-number v-model="cutStart"  size="small"/>
      <span class="mr-5 ml-5">CUT END</span>
      <a-input-number v-model="cutEnd"  size="small"/>

      <a-button @click="cut" type="primary"  size="small" class="ml-5">CUT</a-button>
    </div>
    <div class="clear-5"></div>

    <a-divider>UNPACK RESULT</a-divider>
    <div class="fr">
      <span class="mr-5">USING SCHEMA</span>
      <a-select v-model="schemaId" @change="parse" size="small" style="width: 100px" allowClear placeholder="Select">
        <a-select-option v-for="s in schemas" :key="s.id" :value="s.id">
          {{s.name}}
        </a-select-option>
      </a-select>
    </div>

    <div class="clear-20"></div>
    <a-table :columns="columns" :rowKey="(record,index) => index" :dataSource="data" :pagination="false" size="small" />
    <div class="clear-20"></div>
  </div>
</template>

<script>

import BKV from '../core/bkv'
import {mapState, mapActions, mapGetters} from 'vuex'

export default {
  name: 'unpack',
  data() {
    return {
      bkvHex: '040101103b0a01020000000000000000090103822506200009880f02026e48424c4632303434303535350f02026e48424c4632303434303535360f02026e48424c4632303434303635350f02026e48424c4632303434303635360f02026e48424c4632303434303638390f02026e48424c4632303434303639300f02026e48424c4632303434303937310f02026e48424c463230343430393732',
      data: [],
      schemaId: undefined,

      cutStart: 8,
      cutEnd: 6,
    }
  },

  computed: {
    ...mapGetters('schema', {
      schemas: 'getAllSchemas',
    }),
    columns() {
      let columns = [];
      if (this.schemaId) {
        columns.push(
          { title: 'KEY TYPE', dataIndex: 'key_type', width: '80px', },
          { title: 'KEY LEN', dataIndex: 'key_len', width: '80px', },
          { title: 'KEY', dataIndex: 'key', width: '80px', },
          { title: 'KEY NAME', dataIndex: 'key_name', width: '240px', },
          { title: 'VALUE TYPE', dataIndex: 'value_type', width: '96px' },
          { title: 'VALUE', dataIndex: 'value', },
          { title: 'HEX VALUE', dataIndex: 'hex_value', }
        );
      } else {
        columns.push(
          { title: 'KEY TYPE', dataIndex: 'key_type', width: '100px', },
          { title: 'KEY LEN', dataIndex: 'key_len', width: '100px', },
          { title: 'KEY', dataIndex: 'key', width: '100px', },
          { title: 'KEY NAME', dataIndex: 'key_name', width: '260px', },
          { title: 'VALUE', dataIndex: 'value', },
        );
      }
      return columns;
    }
  },

  mounted: function () {
    console.log(this.bkvHex);
    this.parse();
  },

  methods: {
    parse() {
      this.data = [];
      if (this.bkvHex === '') {
        return;
      }
      this.bkvHex = this.bkvHex.replace(/\s*/g,"")

      let bkv;
      try {
        let result = BKV.BKV.unpack(BKV.hexToBuffer(this.bkvHex));
        console.log('[parse] result', result);
        if (result.code !== 0) {
          this.$message.error(`parse bkv fail: code=${result.code}`)
          return;
        }
        bkv = result.bkv;
      } catch (e) {
        this.$message.error(`parse bkv err: ${e}`)
      }

      let schema = this.schemas.find(s => s.id === this.schemaId);
      let schemaItems = schema && schema.items;

      let items = bkv.items();
      for (let i in items) {
        let item = items[i];
        console.log('[parse] item:', item);
        let rawKey = item.key();
        let key = rawKey;
        if (!item.isStringKey()) {
          key = '0x' + key.toString(16).toUpperCase();
        }

        let value_type = BKV.getValueType(rawKey, schemaItems);

        let value = BKV.bufferToHex(item.value()).toUpperCase(); // HEX VALUE
        if (schemaItems) {
          value = bkv.parse(rawKey, item.value(), schemaItems).toString(); // 解析后 VALUE
        }

        let key_name = BKV.getKeyName(rawKey, schemaItems);
        let hex_value = BKV.bufferToHex(item.value()).toUpperCase();

        this.data.push({
          key: key,
          key_name: key_name,
          key_len: item.keyLength(),
          key_type: item.isStringKey() ? 'STRING' : 'NUMBER',
          value: value,
          value_type: value_type,
          hex_value: hex_value,
        });
      }
      console.log('[parse] data:', this.data);
    },
    cut() {
      this.bkvHex = this.bkvHex.slice(this.cutStart, this.bkvHex.length - this.cutEnd);
      console.log('this.bkvHex:', this.bkvHex)
      this.parse();
    }
  }
}
</script>

<style scoped lang="scss">
.unpack {
  /*padding: 20px;*/

  width: 1000px;
  max-width: 100%;
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
