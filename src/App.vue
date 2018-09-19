<template>
  <div id="app">
    <link :href="skinFile" rel="stylesheet" v-if="skin !== 'Default'">
    <b-navbar toggleable="md" type="dark" variant="primary">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
      <b-navbar-brand href="#">TFS User Dash</b-navbar-brand>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav>
          <b-form-select v-model="skin" :options="skins" />
        </b-navbar-nav>


      </b-collapse>


    </b-navbar>
    <main class="row">
      <div class="col-md-3">
        <b-list-group class="m-3">
          <b-list-group-item v-for="(item, index) in config.tables" :key="item.name" :active="index === currentTableIndex"
            @click="currentTableIndex = index" class="text-uppercase">{{item.title}}</b-list-group-item>
        </b-list-group>
      </div>
      <div class="col-md-9">
        <b-card class="m-3" v-if="table">
          <h2 slot="header">{{table.name}}</h2>
          <div class="my-2">
            <button class="btn btn-success" @click="create">新增</button>
          </div>

          <b-table :items="items" :fields="gridFields" responsive class="data-table">
            <template slot-scope="row" :slot="field.key" v-for="field in fields">
              <div :key="field.key">
                <span v-if="false">hold</span>
                <div v-else-if="field.key === 'id'" class="field-value-id text-limit" :title="row.value">
                  {{row.value}}
                </div>
                <img class="td-img" :src="getPath(row.value) + '!/fw/375'" v-else-if="getDataType(row.value) === 'image'">
                <video class="td-img" :src="getPath(row.value)" controls v-else-if="getDataType(row.value) === 'video'"></video>
                <span v-else>{{row.value}}</span>
              </div>
            </template>
            <img slot="logo.path" slot-scope="row" :src="row.value" class="td-img">
            <template slot="HEAD_actions">
              
            </template>
            <div slot="_actions" slot-scope="row">
              <button type="button" class="btn btn-primary" @click="edit(row.item)">编辑</button>
              <button type="button" class="btn btn-danger" @click="delete(row.item)">删除</button>
            </div>
          </b-table>

          <b-modal v-model="showModal" hide-footer>
            <b-form ref="form" @submit.prevent="submit">
              <b-form-group :key="field.key" v-for="field in formFields" v-bind="field">
                <!-- <b-form-input v-model="model[name]" :name="name"></b-form-input> -->
                <component :is="`b-form-${field.tag || 'input'}`" v-model="model[field.key]" :name="field.key" v-bind="field"></component>
              </b-form-group>
              <button class="btn btn-primary btn-block">保存</button>
            </b-form>

          </b-modal>

        </b-card>
      </div>
    </main>
    <footer>

    </footer>
  </div>
</template>

<script>
import _ from "lodash";
import BFormHtml from "./components/BFormHtml";
const STORAGE_PREFIX = "TFS_DASHBOARD_";

export default {
  name: "app",
  components: {
    BFormHtml
  },
  data() {
    return {
      config: {
        tables: []
      },
      showModal: false,
      app: {
        client_id: localStorage.getItem(STORAGE_PREFIX + "CLIENT_ID")
      },
      tables: [],
      currentTableIndex: 0,
      items: [],
      model: {},
      skins: "Default,Cerulean,Cosmo,Cyborg,Darkly,Flatly,Journal,Litera,Lumen,Lux,Materia,Minty,Pulse,Sandstone,Simplex,Sketchy,Slate,Solar,Spacelab,Superhero,United,Yeti".split(
        ","
      ),
      skin: "Default",
      disabledEditFields: [
        "_id",
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "_actions"
      ]
    };
  },
  computed: {
    skinFile() {
      return `https://cdn.bootcss.com/bootswatch/4.1.1/${String(
        this.skin
      ).toLowerCase()}/bootstrap.min.css`;
    },
    table() {
      return this.config.tables[this.currentTableIndex];
    },
    fields() {
      return _.get(this.table, "fields", []);
    },
    gridFields() {
      const fields = _.omitBy(this.fields, v => v.listable === false);
      fields._actions = {};
      return fields;
    },
    formFields() {
      return _.omitBy(this.fields, v => {
        return v.editable === false || this.disabledEditFields.includes(v.key);
      });
    }
  },
  watch: {
    tables() {
      this.fetchConfig();
    },
    "table.id"(val) {
      this.fetchData(val);
      this.fetchFieldOptions();
    }
  },
  methods: {
    fetchConfig() {
      const table = this.tables.find(v => v.name === "tfs_dashboard");
      if (!table) {
        return;
      }

      this.$http.get(`table/${table.id}/record/`).then(res => {
        const config = _.get(res, "data.objects[0].config");
        if (config) {
          this.config = config;
        }
      });
    },
    fetchFieldOptions() {
      this.tables[this.currentTableIndex].schema.fields.map(v => {
        if (v.name.includes("_id")) {
          const [relatedTableName] = v.name.split("_");
          const relatedTable = this.tables.find(
            v => v.name == relatedTableName
          );
          if (!relatedTable) {
            return v;
          }
          v.tag = "select";
          v.options = [];
          this.$http.get(`table/${relatedTable.id}`).then(res => {
            v.options.concat(
              res.data.objects.map(row => ({
                text: row.name || row.title,
                value: row.id
              }))
            );
          });
          return v;
        }
      });
    },
    getPath(value) {
      return String(_.get(value, "path", value) || "");
    },
    getDataType(value) {
      const val = this.getPath(value)
        .split(".")
        .pop();
      if (!val) {
        return;
      }

      if (["mp4"].indexOf(val) > -1) {
        return "video";
      }
      if (["jpg", "jpeg", "png", "gif", "webp"].indexOf(val) > -1) {
        return "image";
      }
      return null;
    },
    fetchTables() {
      this.$http.get(`table/`).then(res => {
        this.tables = res.data.objects;
      });
    },
    fetchData(id) {
      this.$http
        .get(`table/${id}/record/`, {
          params: {
            order_by: "-updated_at",
            limit: 100,
            offset: 0,
            where: {}
          }
        })
        .then(res => {
          this.items = res.data.objects;
        });
    },
    submit() {
      this.showModal = false;
      const id = this.model._id || "";
      const method = id ? "put" : "post";
      const data = new FormData();
      const fields = Array.from(this.formFields)
      console.log(fields)
      fields.map(field => {
        data.append(field.key, this.model[field.key]);
      });
      console.log(this.model, data);
      this.$http[method](`table/${this.table.id}/record/${id}`, data)
        .then(() => {
          this.fetch();
        })
        .catch(err => {
          global.console.log("error", err);
        });
      this.model = {};
    },
    create() {
      this.model = {};
      this.showModal = true;
    },
    edit(row) {
      this.model = _.clone(row);
      this.showModal = true;
    },
    delete(row) {
      if (window.confirm("确定要删除吗？")) {
        this.$http.delete(`table/${this.table.id}/record/${row}`).then(() => {
          this.fetch();
        });
      }
    },
    init() {
      const js = document.createElement("script");
      js.setAttribute(
        "src",
        "https://cloud.minapp.com/custom-userdash/auth/86eed8b6168fd2645baf/"
      );
      js.setAttribute("preload", true);
      document.body.appendChild(js);
    }
  },
  created() {
    this.init();
    // this.skin = "Lumen";
    this.fetchTables();
  }
};
</script>

<style>
.td-img {
  max-height: 4em;
}
[v-cloak] {
  display: none;
}
.data-table th {
}
.text-limit {
  white-space: nowrap;
  max-width: 10em;
  text-overflow: ellipsis;
  overflow: hidden;
  text-transform: uppercase;
}
.text-limit:hover {
  overflow: visible;
  max-width: auto;
  position: relative;
  z-index: 1;
  background: #fff;
}
.card-header {
  text-transform: uppercase;
}
.field-value-id {
  max-width: 4em;
}
</style>
