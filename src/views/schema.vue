<template>
  <div class="schema">
    <a-button @click="showImport" type="primary" size="small" class="mr-5">ADD</a-button>
    <a-upload name="import" :beforeUpload="beforeSchemaUpload" :showUploadList="false" size="small" class="mr-5">
      <a-button type="primary" size="small">IMPORT</a-button>
    </a-upload>
    <a-button @click="exportSchema" type="primary" size="small" class="mr-5">EXPORT</a-button>
    <a-button @click="del" type="danger" size="small" class="mr-5">DEL</a-button>
    <div class="clear-10"></div>
    <a-tabs
      tab-position="left"
      ref="tab"
      @change="onTabChange"
      :active-key="activeTabKey"
    >
      <a-tab-pane v-for="s in schemas" :key="s.id" :tab="s.name">
        <bkv-schema-editor :schema="s"></bkv-schema-editor>
      </a-tab-pane>
    </a-tabs>
    <div class="clear-10"></div>

    <a-modal v-model="importDialogVisible" title="ADD SCHEMA" @ok="handleImport"
             @cancel="importDialogVisible = false">
      <a-form-model :model="importSchemaForm" ref="importSchemaForm" :rules="importSchemaFormRules"
                    :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
        <a-form-model-item label="Id" prop="id">
          <a-input v-model="importSchemaForm.id"/>
        </a-form-model-item>
        <a-form-model-item label="Name" prop="name">
          <a-input v-model="importSchemaForm.name"/>
        </a-form-model-item>
        <a-form-model-item label="Items(JSON)" prop="items">
          <a-input v-model="importSchemaForm.items" type="textarea" :placeholder="importSchemaItemsPlaceHolder" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>

  </div>
</template>

<script>

import BKV from '../core/bkv'
import {mapState, mapActions, mapGetters} from 'vuex'
import bkvSchemaEditor from '@/components/bkv-schema-editor'

const columns = [
  {
    title: 'KEY',
    dataIndex: 'key_label',
    width: '100px',
  },
  {
    title: 'VALUE TYPE',
    dataIndex: 'value_type',
    width: '100px',
  },
  {
    title: 'KEY NAME',
    dataIndex: 'key_name',
  },

];

export default {
  name: 'unpack',
  components: {bkvSchemaEditor},
  data() {
    return {
      columns,

      activeTabKey: '',

      importDialogVisible: false,
      importSchemaForm: {
        id: '',
        name: '',
        items: '',
      },
      importSchemaFormRules: {
        id: [{required: true, message: 'Required', trigger: 'blur'},],
        name: [{required: true, message: 'Required', trigger: 'blur'},],
      },
      importSchemaItemsPlaceHolder: '[{"key":1,"value_type":"uint8","key_name":"type"}]'
    }
  },
  computed: {
    ...mapGetters('schema', {
      schemas: 'getAllSchemas',
    })
  },
  mounted: function () {
    console.log('schemas', this.schemas);
    this.activeFirstTab();
  },
  methods: {
    ...mapActions('schema', [
      'saveSchema',
      'deleteSchema',
    ]),

    activeFirstTab() {
      if (this.schemas.length > 0) {
        this.activeTabKey = this.schemas[0].id;
      }
    },

    add() {
      console.log(this.$store.state.schema)
      this.saveSchema({id: 'bkv-20015', name: '20015', items: testSchemaItems});
      this.activeFirstTab();
    },

    del() {
      this.deleteSchema(this.activeTabKey);
      this.activeFirstTab();
    },

    onTabChange(key) {
      console.log("tab change")
      console.log(arguments)
      this.activeTabKey = key;
    },

    showImport() {
      this.importSchemaForm.id = '';
      this.importSchemaForm.name = '';
      this.importSchemaForm.items = '';

      this.importDialogVisible = true;
    },

    handleImport() {
      this.$refs.importSchemaForm.validate(valid => {
        if (valid) {

          let id = this.importSchemaForm.id;
          let name = this.importSchemaForm.name;
          let items;
          try {
            let itemsJson = this.importSchemaForm.items;
            if (itemsJson === '') {
              itemsJson = '[]';
            }
            items = JSON.parse(itemsJson);
          } catch (e) {
            this.$message.error(`parse items fail: ${e.toString()}`);
            return
          }

          try {
            BKV.validateSchema(items)
          } catch (e) {
            this.$message.error(`validate items fail: ${e.toString()}`);
            return
          }

          this.saveSchema({id: id, name: name, items: items});
          this.importDialogVisible = false;
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },

    edit() {

    },

    importSchema() {

    },

    beforeSchemaUpload(file, fileList) {
      console.log('beforeSchemaUpload');
      console.log(arguments);

      if (!file) {
        return false;
      }

      console.log("read file...");
      let reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = e => {
        let content = e.target.result;
        try {
          let schema = JSON.parse(content);
          if (!schema || typeof schema !== 'object') {
            this.$message.error(`invalid schema`)
            return
          }
          let id = schema.id;
          if (!id || typeof id !== 'string') {
            this.$message.error(`invalid schema id`)
            return
          }

          let name = schema.name;
          if (!name || typeof name !== 'string') {
            this.$message.error(`invalid schema name`)
            return
          }

          let items = schema.items;
          BKV.validateSchema(items);

          this.saveSchema({id, name, items});
          setTimeout(() => {
            this.activeFirstTab();
          }, 500);
        } catch (e) {
          console.log(e);
          this.$message.error(`import fail: ${e.message}`)
        }
      }
      reader.onerror = function (e) {
        this.$message.error(`read file fail: ${e}`)
      }

      return false;
    },

    exportSchema() {
      let schema = this.schemas.find(s => s.id === this.activeTabKey);
      if (!schema) {
        return;
      }

      const data = JSON.stringify(schema)
      const blob = new Blob([data], {type: 'text/plain'})
      const e = document.createEvent('MouseEvents');
      const a = document.createElement('a');
      a.download = `bkv-schema-${schema.name}.json`;
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
      e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      a.dispatchEvent(e);
      a.remove();
    },
  }
}

</script>

<style scoped lang="scss">
.schema {
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
