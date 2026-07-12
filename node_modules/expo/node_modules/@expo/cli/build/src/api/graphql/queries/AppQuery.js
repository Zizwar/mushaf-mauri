"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppQuery", {
    enumerable: true,
    get: function() {
        return AppQuery;
    }
});
const _client = require("../client");
const AppQueryDocument = (0, _client.graphql)(`
  query AppByIdQuery($appId: String!) {
    app {
      byId(appId: $appId) {
        id
        ...AppFragment
      }
    }
  }

  fragment AppFragment on App {
    id
    scopeKey
    ownerAccount {
      id
      name
    }
  }
`);
const AppQuery = {
    async byIdAsync (projectId) {
        const data = await (0, _client.query)(AppQueryDocument, {
            appId: projectId
        });
        return data.app.byId;
    }
};

//# sourceMappingURL=AppQuery.js.map