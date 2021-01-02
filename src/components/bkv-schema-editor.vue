<template>
  <div class="bkv-schema-editor">
    <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
      <a-form-item label="Name">
        <a-input v-model="schema.name" @change="save" />
      </a-form-item>
    </a-form>
    <a-table :columns="columns" :data-source="items" :pagination="false" size="small">
      <template slot="key_type" slot-scope="text, record">
        {{ record.key | keyType }}
      </template>
      <template slot="key" slot-scope="text, record">
        {{ record.key | keyLabel }}
      </template>
      <template slot="value_type" slot-scope="value_type, record">
        <a-select :value="record.value_type" @change="updateValueType($event, record)" size="small" style="width: 100px">
          <a-select-option v-for="vt in valueTypes" :key="vt">
            {{vt}}
          </a-select-option>
        </a-select>
      </template>
      <template slot="key_name" slot-scope="key_name, record">
        <a-input :value="key_name" @input="updateKeyName($event, record)" size="small"></a-input>
      </template>
      <template slot="action" slot-scope="record">
        <a-button @click="deleteItem(record)" type="danger" size="small" class="mr-5">DEL</a-button>
      </template>
    </a-table>
    <div class="clear-5"></div>
    <div class="fr items-action-holder">
      <a-button type="primary" @click="showAddItemDialog" class="add-item" size="small">ADD</a-button>
    </div>
    <div class="clear-5"></div>

    <a-modal v-model="addItemDialogVisible" title="IMPORT SCHEMA" @ok="handleAddItem"
             @cancel="addItemDialogVisible = false">
      <a-form-model :model="addItemForm" ref="addItemForm" :rules="addItemFormRules"
                    :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
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
          <a-select v-model="addItemForm.value_type" @change="save">
            <a-select-option v-for="vt in valueTypes" :key="vt">
              {{vt}}
            </a-select-option>
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
  name: "bkv-schema-editor",
  props: {
    schema: {
      type: Object,
      default: function () {
        return {};
      }
    },
  },
  data() {
    return {
      columns: [
        { title: 'KEY TYPE', dataIndex: 'key_type', key: 'key_type', width: '100px', scopedSlots: { customRender: 'key_type' }, },
        { title: 'KEY', dataIndex: 'key_label', key: 'key', width: '100px', scopedSlots: { customRender: 'key' }, },
        { title: 'VALUE TYPE', dataIndex: 'value_type', key: 'value_type', width: '120px', scopedSlots: { customRender: 'value_type' }, },
        { title: 'KEY NAME', dataIndex: 'key_name', key: 'key_name', scopedSlots: { customRender: 'key_name' }, },
        { title: 'ACTION', dataIndex: '', key: 'action',  width: '70px', scopedSlots: { customRender: 'action' } },
      ],

      valueTypes: [ 'uint8', 'uint16', 'uint32', 'uint64', 'int8', 'int16', 'int32', 'int64', 'float32', 'float64', 'string', 'raw', ],

      items: [],

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

  filters: {
    keyType: function (val) {
        let keyType = 'number';
        if (typeof val === 'string') {
          keyType = 'string';
        }
        return keyType;
    },

    keyLabel: function (key) {
      let key_label = key;
      if (typeof key === "number") {
        key_label = `0x${key.toString(16)}`;
      }
      return key_label;
    }
  },

  mounted: function () {
    console.log('schema', this.schema);
    this.makeItems();
  },

  methods: {
    ...mapActions('schema', [
      'saveSchema',
      'deleteSchema',
      'updateSchemaItem',
    ]),

    makeItems: function () {
      this.items = this.schema.items;
      // this.items = this.schema.items.map(item => {
      //   let keyType = 'number';
      //   if (typeof item.key === 'string') {
      //     keyType = 'string';
      //   }
      //   return {
      //     ...item,
      //     key_label: this.makeKeyLabel(item.key),
      //     key_type: keyType,
      //   }
      // });
      console.log('make items', this.items);
    },

    makeKeyLabel: function (key) {
      let key_label = key;
      if (typeof key === "number") {
        key_label = `0x${key.toString(16)}`;
      }
      return key_label;
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

    updateKeyName: function (e, item) {
      this.updateSchemaItem({
        schema_id: this.schema.id,
        item_key: item.key,
        prop: 'key_name',
        value: e.target.value,
      })
    },

    updateValueType: function (e, item) {
      console.log(e);
      this.updateSchemaItem({
        schema_id: this.schema.id,
        item_key: item.key,
        prop: 'value_type',
        value: e,
      })
    },

    save: function () {
      console.log(arguments);

      if (this.schema.name === '') {
        this.$message.error(`name should not be empty`);
        return;
      }

      let items = this.items;

      try {
        BKV.validateSchema(items)
      } catch (e) {
        this.$message.error(`validate items fail: ${e.toString()}`);
        return
      }

      this.saveSchema({
        id: this.schema.id,
        name: this.schema.name,
        items: items,
      })
    },

    showAddItemDialog: function () {
      this.addItemDialogVisible = true;
      this.addItemForm.key_type = 'number';
      this.addItemForm.key = '';
      this.addItemForm.value_type = 'raw';
    },

    handleAddItem: function () {
      this.$refs.addItemForm.validate(valid => {
        if (valid) {
          let keyType = this.addItemForm.key_type;
          let key = this.addItemForm.key;
          key = this.parseKey(keyType, key);
          if (key === undefined) {
            this.$message.error(`invalid key`);
            return;
          }

          console.log('add item');
          let items = [...this.items, {
            key: key,
            value_type: this.addItemForm.value_type,
            key_name: this.addItemForm.key_name,
          }];

          try {
            BKV.validateSchema(items)
          } catch (e) {
            this.$message.error(`validate items fail: ${e.toString()}`);
            return
          }

          this.items = items;
          this.save();
          this.addItemDialogVisible = false;
        } else {
          return false;
        }
      });
    },

    deleteItem: function (item) {
      this.items = this.items.filter(i => i.key !== item.key);
      this.save();
    },


  }
}
</script>

<style scoped lang="scss">
  .bkv-schema-editor {
    input.ant-input[type=text] {
      font-size: 12px;
    }

    .items-action-holder {
      margin-right: 31px;
    }
  }

</style>
