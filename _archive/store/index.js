import { createStore, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web and AsyncStorage for react-native
import thunk from "redux-thunk";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import reducer from "../reducer";
const persistConfig = {
  key: "root",
  stateReconciler: autoMergeLevel2,
  storage,
 // whitelist: ["wino","bookmarks","moqri","khitma","author",], // only app will be persisted
};
const persistedReducer = persistReducer(persistConfig, reducer);
export default () => {
  const store = createStore(persistedReducer, applyMiddleware(thunk));
  const persistor = persistStore(store);
  return { persistor, store };
};

