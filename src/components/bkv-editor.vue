<template>
<div class="bkv-editor">
  <div class="editor-title">
    <div class="using-schema">
      <span class="mr-5">USING SCHEMA</span>
      <a-select v-model="schemaId" size="small" style="width: 140px" @change="changeSchema" allowClear placeholder="Select Schema">
        <a-select-option v-for="s in schemas" :key="s.id" :value="s.id">{{s.name}}</a-select-option>
      </a-select>
    </div>
    <a-button class="add-item" type="primary" size="small" @click="handleAddItem">ADD KV</a-button>

    <template v-if="createKeyList.length > 0">
      <a-button class="add-item" type="primary" size="small" @click="showAddSchemaDialog()" v-if="schemaId">SAVE SCHEMA</a-button>
      <a-button class="add-item" type="primary" size="small" @click="showAddSchemaDialog(true)">SAVE NEW SCHEMA</a-button>
    </template>
  </div>
  <div class="editor-list">
    <div class="bkv-item" v-for="(item, index) of itemList" :key="index">
      <a-select class="key" placeholder="Select Key" v-model="item.key" @change="updateKV" size="small" show-search option-filter-prop="children">
        <a-select-option v-for="itemKey in keyList" :key="itemKey.key" :value="itemKey.key">
          0x{{ itemKey.key.toString(16).toUpperCase() + ' ' + itemKey.key_name }}
        </a-select-option>
        <div slot="dropdownRender" slot-scope="menu">
          <v-nodes :vnodes="menu" />
          <a-divider style="margin: 4px 0;"/>
          <div @click="showAddKeyDialog"  @mousedown="e => e.preventDefault()" style="padding: 4px 8px; cursor: pointer;">
            <a-icon type="plus" /> ADD KEY
          </div>
        </div>
      </a-select>

      <a-input class="value" size="small" placeholder="Value" v-model="item.value" @keyup.native="updateKV" @change="updateKV" @blur="updateKV"/>

      <span class="kv" :title="item.kv">{{ item.kv }}</span>
      <a-button type="danger" size="small" @click="handleDelItem(index)">DEL</a-button>
    </div>
  </div>
  <div class="editor-result">
    <div class="bkv" v-if="itemList.length > 0">BKV: {{ bkv }}</div>
  </div>
  <!-- 添加Key -->
  <a-modal v-model="addKeyVisible" title="ADD KEY"
    @ok="handleAddKey" @cancel="addKeyVisible = false">
    <a-form-model :model="addKeyForm" ref="addKeyForm" :rules="addKeyFormRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
      <a-form-model-item label="Key Type" prop="key_type">
        <a-radio-group v-model="addKeyForm.key_type">
          <a-radio-button value="number">number</a-radio-button>
          <a-radio-button value="string">string</a-radio-button>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="Key" prop="key">
        <a-input v-model="addKeyForm.key" />
      </a-form-model-item>
      <a-form-model-item label="Key Name" prop="key_name">
        <a-input v-model="addKeyForm.key_name" />
      </a-form-model-item>
      <a-form-model-item label="Value Type" prop="value_type">
        <a-select v-model="addKeyForm.value_type">
          <a-select-option v-for="vt in valueTypes" :key="vt">{{vt}}</a-select-option>
        </a-select>
      </a-form-model-item>
    </a-form-model>
  </a-modal>

  <!-- 保存Schema -->
  <a-modal v-model="addSchemaVisible" title="ADD SCHEMA" @ok="handleAddSchema" @cancel="addSchemaVisible = false">
    <a-form-model :model="schemaForm" ref="schemaForm" :rules="schemaFormRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
      <a-form-model-item label="Id" prop="id">
        <a-input v-model="schemaForm.id"/>
      </a-form-model-item>
      <a-form-model-item label="Name" prop="name">
        <a-input v-model="schemaForm.name"/>
      </a-form-model-item>
      <a-form-model-item label="Items(JSON)" prop="items">
        <a-input v-model="schemaForm.items" type="textarea" :placeholder="schemaFormPlaceholder" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</div>
</template>

<script>
import BKV from '../core/bkv'
import {mapState, mapActions, mapGetters} from 'vuex'

export default {
  name: "bkv-editor",
  props: {},
  components: {
    VNodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes,
    },
  },
  data() {
    return {
      schemaId: undefined,
      schemaKeyList: [], // schema 中的 keyList
      createKeyList: [], // 手动创建的 keyList

      itemList: [],
      bkv: '',

      valueTypes: [ 'uint8', 'uint16', 'uint32', 'uint64', 'int8', 'int16', 'int32', 'int64', 'float32', 'float64', 'string', 'raw', ],
      addKeyVisible: false,
      addKeyForm: {
        key: '',
        key_name: '',
        key_type: '',
        value_type: '',
      },
      addKeyFormRules: {
        key_type: [{required: true, message: 'Required', trigger: 'blur'},],
        key: [{required: true, message: 'Required', trigger: 'blur'},],
        key_name: [{required: true, message: 'Required', trigger: 'blur'},],
      },

      addSchemaVisible: false,
      schemaForm: {
        id: '',
        name: '',
        items: '',
      },
      schemaFormRules: {
        id: [{required: true, message: 'Required', trigger: 'blur'},],
        name: [{required: true, message: 'Required', trigger: 'blur'},],
      },
      schemaFormPlaceholder: '[{"key":1,"value_type":"uint8","key_name":"type"}]'
    }
  },
  computed: {
    ...mapGetters('schema', {
      schemas: 'getAllSchemas',
    }),
    keyList() {
      console.log('this.schemaKeyList:', this.schemaKeyList)
      console.log('this.createKeyList:', this.createKeyList)
      return [ ...this.schemaKeyList, ...this.createKeyList, ]
    }
  },
  methods: {
    ...mapActions('schema', [
      'saveSchema',
      'deleteSchema',
      'updateSchemaItem',
    ]),

    /* 更换 schema */
    changeSchema() {
      let schema = this.schemas.find(s => s.id === this.schemaId);
      console.log('schema:', schema)
      this.schemaKeyList = schema ? schema.items : [];
      console.log('schemaKeyList:', this.schemaKeyList)
      this.updateKV()
    },
    /* 弹框展示 添加 key */
    showAddKeyDialog() {
      this.addKeyForm.key = '';
      this.addKeyForm.key_name = '';
      this.addKeyForm.key_type = 'number';
      this.addKeyForm.value_type = 'raw';

      this.addKeyVisible = true;
    },
    /* 弹框确认 添加 key */
    async handleAddKey() {
      let valid;
      try {
        valid = await this.$refs.addKeyForm.validate();
        console.log('handleAddKey valid:', valid)
      } catch (e) {
        console.log('handleAddKey e:', e)
        valid = false
      }
      if (!valid) { return; }

      let keyType = this.addKeyForm.key_type;
      let key = this.addKeyForm.key;
      key = this.parseKey(keyType, key);
      if (key === undefined) { return this.$message.error(`invalid key`); }
      console.log('add key', this.keyList);

      let keyList = [...this.createKeyList, {
        key: key,
        key_name: this.addKeyForm.key_name,
        value_type: this.addKeyForm.value_type,
      }];

      try {
        BKV.validateSchema(keyList)
      } catch (e) {
        this.$message.error(`validate items fail: ${e.toString()}`);
        return
      }
      this.createKeyList = keyList;

      this.addKeyVisible = false;
    },
    parseKey(keyType, key) {
      if (keyType === 'number') { return parseInt(key); }
      if (keyType === 'string') { return key = '' + key; }
      return undefined;
    },

    /* 弹框展示 添加 schema */
    showAddSchemaDialog(flagNew = false) {
      let now = new Date();
      let schema = { id: now.getTime() }
      if (!flagNew) { schema = this.schemas.find(s => s.id === this.schemaId) }

      this.schemaForm.id = schema.id || '';
      this.schemaForm.name = schema.name || '';
      this.schemaForm.items = JSON.stringify(this.keyList);

      this.addSchemaVisible = true;
    },
    async handleAddSchema() {
      let valid;
      try {
        valid = await this.$refs.schemaForm.validate();
        console.log('handleAddSchema valid:', valid)
      } catch (e) {
        console.log('handleAddSchema e:', e)
        valid = false
      }
      if (!valid) { return; }

      let form = JSON.parse(JSON.stringify(this.schemaForm));
      form.items = JSON.parse(form.items)
      try {
        BKV.validateSchema(form.items)
      } catch (e) {
        return this.$message.error(`validate items fail: ${e.toString()}`);
      }

      this.saveSchema({
        id: form.id,
        name: form.name,
        items: form.items,
      })

      this.schemaId = form.id
      this.createKeyList = [];

      this.addSchemaVisible = false;
    },

    /* 添加 item */
    handleAddItem() {
      this.itemList = [...this.itemList, {key: undefined, value: '', kv: '',}]
    },
    /* 删除 item */
    handleDelItem(index) {
      let itemList = this.itemList;
      itemList.splice(index, 1);
      this.itemList = itemList;
    },
    /* 通过(选择的) key 在 keyList 中查找对应 keyItem */
    getKeyItem(key) {
      key = parseInt(key);
      for (let i in this.keyList) {
        let keyItem = this.keyList[i];
        if (keyItem.key === key) {
          return keyItem;
        }
      }
    },
    /* 通过(输入的) value 和 keyItem 将 value 转换为 buffer */
    getValueBuffer(value, keyItem) {
      // value = value.toUpperCase();
      // if (value.indexOf('0X') === 0) {
      //     value = value.substring(2);
      //     value = BKV.hexToBuffer(value);
      //     return value;
      // }

      if (value === '') { return new Uint8Array(0); }

      let type = keyItem.value_type;
      switch (type) {
        case 'uint8': {
          value = parseInt(value);
          let buffer = new Uint8Array(1);
          buffer[0] = value;
          return buffer;
        }

        case 'uint16': {
          value = parseInt(value);
          let buffer = new Uint8Array(2);
          let dv = new DataView(buffer.buffer);
          dv.setUint16(0, value);
          return buffer;
        }

        case 'uint32': {
          value = parseInt(value);
          let buffer = new Uint8Array(4);
          let dv = new DataView(buffer.buffer);
          dv.setUint32(0, value);
          return buffer;
        }

        case 'uint64': {
          value = parseInt(value);
          let buffer = new Uint8Array(8);
          let dv = new DataView(buffer.buffer);
          dv.setBigUint64(0, value);
          return buffer;
        }


        case 'int8': {
          value = parseInt(value);
          let buffer = new Uint8Array(1);
          let dv = new DataView(buffer.buffer);
          dv.setInt8(0, value);
          return buffer;
        }

        case 'int16': {
          let buffer = new Uint8Array(2);
          let dv = new DataView(buffer.buffer);
          dv.setInt16(0, value);
          return buffer;
        }

        case 'int32': {
          value = parseInt(value);
          let buffer = new Uint8Array(4);
          let dv = new DataView(buffer.buffer);
          dv.setInt32(0, value);
          return buffer;
        }

        case 'int64': {
          value = parseInt(value);
          let buffer = new Uint8Array(8);
          let dv = new DataView(buffer.buffer);
          dv.setBigInt64(0, value);
          return buffer;
        }

        case 'float32': {
          value = parseInt(value);
          let buffer = new Uint8Array(4);
          let dv = new DataView(buffer.buffer);
          dv.setFloat32(0, value);
          return buffer;
        }

        case 'int64': {
          value = parseInt(value);
          let buffer = new Uint8Array(8);
          let dv = new DataView(buffer.buffer);
          dv.setFloat64(0, value);
          return buffer;
        }

        case 'string': {
          return BKV.stringToBuffer(value)
        }

        case 'hex':
        case 'raw': {
          return BKV.hexToBuffer(value)
        }
      }
    },

    /* 更新 item的kv 和 总的 bkv */
    updateKV() {
      let bkv = new BKV.BKV();

      for (let i in this.itemList) {
        let item = this.itemList[i];
        item.kv = '';
        if (!item.key) { console.log('key', item); continue; }

        let key = parseInt(item.key);
        let keyItem = this.getKeyItem(key);
        if (!keyItem) { console.log('keyItem', item); continue; }

        let value = item.value;
        value = this.getValueBuffer(value, keyItem);
        if (!value) { console.log('value', item); continue; }

        let kv = new BKV.KV(key, value);

        item.kv = BKV.bufferToHex(kv.pack()).toUpperCase();
        console.log(item.kv, key.toString(16), keyItem, value);

        bkv.add(kv);
      }

      this.bkv = BKV.bufferToHex(bkv.pack())
    },
  }
}
</script>

<style scoped lang="scss">
.bkv-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  .editor-title, .editor-result {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }
  .editor-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bkv-item {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    .key { width: 200px; }
    .value { width: 200px; }
    .kv {
      font-family: Consolas, "Courier New", monospace;
      font-size: 14px;
      color: #333;
      padding: 0 5px 0 10px;
      display: inline-block;
      width: 200px;
      text-align: left;
      background: #ddd;
      height: 23px;
      line-height: 23px;
      overflow: hidden;
      border-radius: 3px;
    }
  }
  .bkv {
    font-family: Consolas, "Courier New", monospace;
    font-size: 14px;
    color: #555;
    word-break: break-all;
  }
}
</style>
