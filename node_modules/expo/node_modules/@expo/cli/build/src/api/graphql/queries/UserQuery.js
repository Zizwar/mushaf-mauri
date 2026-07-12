"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserQuery", {
    enumerable: true,
    get: function() {
        return UserQuery;
    }
});
const _client = require("../client");
const CurrentUserDocument = (0, _client.graphql)(`
  query CurrentUser {
    meActor {
      __typename
      id
      ... on UserActor {
        primaryAccount {
          id
        }
        username
      }
      ... on Robot {
        firstName
      }
      accounts {
        id
        users {
          actor {
            __typename
            id
          }
          permissions
        }
      }
    }
  }
`);
const UserQueryDocument = (0, _client.graphql)(`
  query UserQuery {
    meUserActor {
      id
      username
    }
  }
`);
const UserQuery = {
    async currentUserAsync () {
        const data = await (0, _client.query)(CurrentUserDocument, {});
        return data.meActor;
    },
    async meUserActorAsync (headers) {
        const data = await (0, _client.query)(UserQueryDocument, {}, {
            headers
        });
        return {
            id: data.meUserActor.id,
            username: data.meUserActor.username
        };
    }
};

//# sourceMappingURL=UserQuery.js.map