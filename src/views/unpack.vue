<template>
  <div class="unpack">
    <a-textarea placeholder="BKV" :rows="4" v-model="bkvHex" @keyup.native="parse" @change="parse" @blur="parse"/>
    <a-divider>UNPACK RESULT</a-divider>
    <div class="clear-5"></div>
    <div class="fr">
      <span class="mr-5">USING SCHEMA</span>
      <a-select v-model="schemaId" @change="parse" size="small" style="width: 100px" >
        <a-select-option v-for="s in schemas" :key="s.id" :value="s.id">
          {{s.name}}
        </a-select-option>
      </a-select>
    </div>

    <div class="clear-20"></div>
    <a-table :columns="columns"
             :rowKey="record => record.key"
             :dataSource="data"
             :pagination="false"
             size="small"
    />
  </div>
</template>

<script>

import BKV from '../core/bkv'
import {mapState, mapActions, mapGetters} from 'vuex'

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
    width: '100px',
  },
  {
    title: 'KEY NAME',
    dataIndex: 'key_name',
    width: '260px',
  },
  {
    title: 'VALUE',
    dataIndex: 'value',
  }];

export default {
  name: 'unpack',
  data() {
    return {
      bkvHex: '040130fc19040137000304013b000902015408017c112233445566070170312e302e31',
      data: [],
      columns,
      schemaId: '',
    }
  },

  computed: {
    ...mapGetters('schema', {
      schemas: 'getAllSchemas',
    })
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

      let bkv;
      try {
        let result = BKV.BKV.unpack(BKV.hexToBuffer(this.bkvHex));
        console.log('parse result', result);
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
        console.log(item);
        let rawKey = item.key();
        let key = rawKey;
        if (!item.isStringKey()) {
          key = '0x' + key.toString(16).toUpperCase();
        }

        let valueType = BKV.getValueType(rawKey, schemaItems);

        let value = BKV.bufferToHex(item.value()).toUpperCase();
        if (schemaItems) {
          value = bkv.parse(rawKey, schemaItems)
          if (value && valueType !== 'string') {
            value = value + ` (${BKV.bufferToHex(item.value()).toUpperCase()})`
          }
        }

        let key_name = BKV.getKeyName(rawKey, schemaItems);

        this.data.push({
          key: key,
          key_name: key_name,
          key_len: item.keyLength(),
          key_type: item.isStringKey() ? 'STRING' : 'NUMBER',
          value: value,
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

  width: 900px;
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
