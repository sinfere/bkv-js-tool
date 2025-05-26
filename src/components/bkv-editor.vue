<template>
  <div class="bkv-editor">
    <span class="mr-5">USING SCHEMA</span>
    <a-select v-model="schemaId" size="small" class="mr-30" style="width: 100px" @change="changeKeyList">
      <a-select-option v-for="s in schemas" :key="s.id" :value="s.id">
        {{s.name}}
      </a-select-option>
    </a-select>
    <a-button type="primary" @click="handleAddItem" class="add-item" size="small">ADD KV</a-button>

    <div class="clear-10"></div>
    <div v-for="(item, index) of itemList" :key="index">
      <div class="bkv-item">
        <a-select class="key ml-10" placeholder="Select Key" v-model="item.key" @change="updateKV" size="small" show-search option-filter-prop="children">
          <a-select-option v-for="itemKey in keyList" :key="itemKey.key" :value="itemKey.key">
            {{ '0x' + itemKey.key.toString(16).toUpperCase() + ' ' + itemKey.key_name }}
          </a-select-option>
          <div slot="dropdownRender" slot-scope="menu">
            <v-nodes :vnodes="menu" />
            <a-divider style="margin: 4px 0;" />
            <div style="padding: 4px 8px; cursor: pointer;" @mousedown="e => e.preventDefault()" @click="showAddItemDialog">
              <a-icon type="plus" /> ADD KEY
            </div>
          </div>
        </a-select>
        <a-input class="value ml-10" size="small" placeholder="Value" v-model="item.value" @keyup.native="updateKV"
          @change="updateKV" @blur="updateKV"></a-input>
        <span class="kv">{{ item.kv }}</span>
        <a-button class="ml-10" type="danger" size="small" @click="handleDelItem(index)">DEL</a-button>
      </div>
    </div>
    <div class="clear-10"></div>
    <div class="clear-5"></div>
    <div class="bkv" v-if="itemList.length > 0">BKV: {{ bkv }}</div>




    <a-modal v-model="addItemDialogVisible" title="IMPORT SCHEMA" @ok="handleAddKey" @cancel="addItemDialogVisible = false">
      <a-form-model :model="addItemForm" ref="addItemForm" :rules="addItemFormRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
        <a-form-model-item label="Key Type" prop="key_type">
          <a-radio-group v-model="addItemForm.key_type">
            <a-radio-button value="number">number</a-radio-button>
            <a-radio-button value="string">string</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="Key" prop="key">
          <a-input v-model="addItemForm.key" />
        </a-form-model-item>
        <a-form-model-item label="Value Type" prop="value_type">
          <a-select v-model="addItemForm.value_type">
            <a-select-option v-for="vt in valueTypes" :key="vt">{{vt}}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="Key Name" prop="key_name">
          <a-input v-model="addItemForm.key_name" />
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
      keyList: [],
      itemList: [],
      schemaId: '',
      bkv: '',

      valueTypes: [ 'uint8', 'uint16', 'uint32', 'uint64', 'int8', 'int16', 'int32', 'int64', 'float32', 'float64', 'string', 'raw', ],
      addItemDialogVisible: false,
      addItemForm: {
        key_type: '',
        key: '',
        value_type: '',
        key_name: '',
      },
      addItemFormRules: {
        key_type: [{required: true, message: 'Required', trigger: 'blur'},],
        key: [{required: true, message: 'Required', trigger: 'blur'},],
        key_name: [{required: true, message: 'Required', trigger: 'blur'},],
      },
    }
  },
  computed: {
    ...mapGetters('schema', {
      schemas: 'getAllSchemas',
    }),
  },
  methods: {
    ...mapActions('schema', [
      'saveSchema',
      'deleteSchema',
      'updateSchemaItem',
    ]),
    showAddItemDialog: function () {
      this.addItemDialogVisible = true;
      this.addItemForm.key_type = 'number';
      this.addItemForm.key = '';
      this.addItemForm.value_type = 'raw';
    },
    parseKey: function (keyType, key) {
      if (keyType === 'number') {
        key = parseInt(key);
      } else if (keyType === 'string') {
        key = '' + key;
      } else {
        return undefined;
      }
      return key;
    },
    handleAddKey() {
      this.$refs.addItemForm.validate(valid => {
        if (valid) {
          let keyType = this.addItemForm.key_type;
          let key = this.addItemForm.key;
          key = this.parseKey(keyType, key);
          if (key === undefined) {
            this.$message.error(`invalid key`);
            return;
          }

          console.log('add key', this.keyList);
          let keyList = [...this.keyList, {
            key: key,
            value_type: this.addItemForm.value_type,
            key_name: this.addItemForm.key_name,
          }];

          try {
            BKV.validateSchema(keyList)
          } catch (e) {
            this.$message.error(`validate items fail: ${e.toString()}`);
            return
          }

          let now = new Date()
          let schema = this.schemas.find(s => s.id === this.schemaId) || {
            id: now.getTime(),
            name: now.getTime(),
          };
          this.keyList = keyList;
          this.saveSchema({
            id: schema.id,
            name: schema.name,
            items: keyList,
          })
          this.addItemDialogVisible = false;
        } else {
          return false;
        }
      });
    },

    changeKeyList() {
      let schema = this.schemas.find(s => s.id === this.schemaId);
      console.log('schema:', schema)
      this.keyList = schema && schema.items;
      console.log('this.keyList:', this.keyList)

      this.updateKV()
    },

    handleAddItem() {
      this.itemList = [...this.itemList, {key: undefined, value: '', kv: '',}]
    },

    handleDelItem(index) {
      let itemList = this.itemList;
      itemList.splice(index, 1);
      this.itemList = itemList;
    },

    getKeyDef(key) {
      key = parseInt(key);
      for (let i in this.keyList) {
        let keyItem = this.keyList[i];
        if (keyItem.key === key) {
          return keyItem;
        }
      }
    },

    parseNumberValueToBuffer(value, keyDef) {
      // value = value.toUpperCase();
      // if (value.indexOf('0X') === 0) {
      //     value = value.substring(2);
      //     value = BKV.hexToBuffer(value);
      //     return value;
      // }

      if (value === '') {
        return new Uint8Array(0);
      }

      let type = keyDef.value_type;
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

    updateKV() {
      let bkv = new BKV.BKV();

      for (let i in this.itemList) {
        let item = this.itemList[i];
        item.kv = '';
        if (!item.key) {
          console.log('key', item);
          continue
        }
        let key = parseInt(item.key);
        let keyDef = this.getKeyDef(key);
        if (!keyDef) {
          console.log('keyDef', item);
          continue
        }

        let value = item.value;
        value = this.parseNumberValueToBuffer(value, keyDef);
        if (!value) {
          console.log('value', item);
          continue
        }

        let kv = new BKV.KV(key, value);
        item.kv = BKV.bufferToHex(kv.pack()).toUpperCase();
        console.log(item.kv, key.toString(16), keyDef, value);

        bkv.add(kv);
      }

      this.bkv = BKV.bufferToHex(bkv.pack())
    },

    getBKV() {
      return this.bkv;
    },
  }
}
</script>

<style scoped lang="scss">
.bkv-editor {
  /*padding: 20px;*/

  .add-item {

  }

  .bkv-item {
    padding: 8px 0;
    clear: both;

    * {
      float: left;
    }

    .key {
      width: 200px;
    }

    .value {
      width: 200px;
    }

    .kv {
      font-family: Consolas, "Courier New", monospace;
      font-size: 14px;
      color: #333;
      padding: 0 5px;
      display: inline-block;
      width: 240px;
      text-align: left;
      padding-left: 10px;
      background: #ddd;
      margin-left: 10px;
      height: 23px;
      line-height: 26px;
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
