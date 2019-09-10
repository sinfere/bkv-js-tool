<template>
    <div class="bkv-editor">
        <a-button type="primary" @click="handleAddItem" class="add-item" size="small">ADD KV</a-button>
        <div class="clear-10"></div>
        <div v-for="(item, index) of itemList" :key="index">
            <div class="bkv-item">
                <a-select class="key ml-10" placeholder="Select Key" v-model="item.key" @change="updateKV" size="small">
                    <a-select-option v-for="itemKey in keyList" :key="itemKey.key" :value="itemKey.key">{{ '0x' + itemKey.key.toString(16).toUpperCase() + ' ' + itemKey.name }}</a-select-option>
                </a-select>
                <a-input class="value ml-10" size="small" placeholder="Value" v-model="item.value" @keyup.native="updateKV" @change="updateKV" @blur="updateKV"></a-input>
                <span class="kv">{{ item.kv }}</span>
                <a-button class="ml-10" type="danger" size="small" @click="handleDelItem(index)">DEL</a-button>
            </div>
        </div>
        <div class="clear-10"></div>
        <div class="clear-5"></div>
        <div class="bkv" v-if="itemList.length > 0">BKV: {{ bkv }}</div>
    </div>
</template>

<script>
    import BKV from '../core/bkv'

    export default {
        name: "bkv-editor",
        props: {
            keyList: {
                type: Array,
                default: function () {
                    return [];
                }
            },
        },
        data() {
            return {
                itemList: [],
                bkv: '',
            }
        },

        methods: {
            handleAddItem() {
                this.itemList = [...this.itemList, { key: '', value: '', kv: '', }]
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

                let type = keyDef.type;
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
                    
                    case 'string': {
                        return BKV.stringToBuffer(value)
                    }  
                    
                    case 'hex': {
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
            }
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
