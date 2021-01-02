const state = () => ({
  schemas: [],
})

const getters = {
  findSchema: (state) => ({id, name}) => {
    return state.schemas.find(item => item.id === id || item.name === name)
  },

  getAllSchemas: (state, getters) => {
    return state.schemas;
  }

}

// actions
const actions = {
  saveSchema({state, commit}, schema) {
    commit('addSchema', schema);
    // let searchSchema = state.schemas.find(item => item.id === schema.id || item.name === schema.name);
    // if (searchSchema === undefined) {
    //   commit('addSchema', schema);
    //   return
    // }
    //
    // searchSchema.items = [...schema.items];
  },

  deleteSchema({state, commit}, id) {
    commit('deleteSchema', id);
  },

  updateSchemaItem({commit}, payload) {
    commit('updateSchemaItem', payload)
  },

  updateSchemaName({commit}, payload) {
    commit('updateSchemaName', payload)
  },

}

// mutations
const mutations = {
  addSchema(state, {id, name, items}) {
    let schema = state.schemas.find(item => item.id === id);
    if (schema === undefined) {
      state.schemas.push({
        id,
        name,
        items
      })
      return
    }
    schema.name = name;
    schema.items = [...items];
  },

  deleteSchema(state, id) {
    state.schemas = state.schemas.filter(item => item.id !== id)
  },

  updateSchemaItem(state, payload) {
    let schemaId = payload.schema_id;
    let itemKey = payload.item_key;
    let prop = payload.prop;
    let value = payload.value;

    let schema = state.schemas.find(item => item.id === schemaId);
    if (schema === undefined) {
      return;
    }

    let item = schema.items.find(i => i.key === itemKey);
    if (item === undefined) {
      return;
    }

    item[prop] = value;
  },

  updateSchemaName(state, payload) {
    let schemaId = payload.schema_id;
    let name = payload.name;
    if (!name) {
      return;
    }

    let schema = state.schemas.find(item => item.id === schemaId);
    if (schema === undefined) {
      return;
    }

    schema.name = name;
  },

}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
