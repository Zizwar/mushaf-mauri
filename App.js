//console.ignoredYellowBox = ['Warning: Each', 'Warning: Failed'];

//
import React, { Component } from "react";
//console.disableYellowBox = true;
import { LogBox ,AppRegistry} from "react-native";
LogBox.ignoreAllLogs(true)
import { registerRootComponent } from "expo";
import AppLoading from 'expo-app-loading';
import * as Font from "expo-font";
//import { Ionicons } from '@expo/vector-icons';
//import Ionicons from "react-native-vector-icons/Ionicons";
import { StyleProvider } from "native-base";
import { Provider } from "react-redux";

import { PersistGate } from "redux-persist/integration/react";
import Root from "./Root";
import getTheme from "./theme/components";
import variables from "./theme/variables/commonColor";

import configureStore from "./store";
const { persistor, store } = configureStore();
export default class App extends Component {
  constructor() {
    super();
    this.state = {
      isReady: false,
      storeCreated: false,
      store: null,
      nightly: false,
    };
  }

  componentDidMount() {
    this.loadDadaApp();
  }
  async loadDadaApp() {
    try {
      //  if(value === "ok")variablesZ = variablesNight
      //    const nightly = value == "ok" ? true : false;

      await Font.loadAsync({
        // Ionicons,
        // Roboto: require("native-base/Fonts/Roboto.ttf"),
        // Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
        Roboto: require("./assets/fonts/pnu.ttf"),
        Roboto_medium: require("./assets/fonts/pnu-med.ttf"),
        //  Ionicons: require("native-base/Fonts/Ionicons.ttf")
        //Ionicons: require("./assets/fonts/Ionicons.ttf"),
        //FontAwesome: require("./assets/fonts/FontAwesome.ttf"),
        //Ionicons: require('@expo/vector-icons'),
        //  Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
      });

      this.setState({ isReady: true });
    } catch (error) {
      alert("####error LoadAsync Font Isnight==>" + error);
      this.setState({ isReady: true });
    }
  }

  render() {
    if (!this.state.isReady) return <AppLoading />;

    // if (!this.state.storeCreated) return null;
    //  return (
    //
    return (
      <StyleProvider style={getTheme(variables)}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <Root />
          </PersistGate>
        </Provider>
      </StyleProvider>
    );
  }
}
AppRegistry.registerComponent('main',() => Root);
//registerRootComponent("root",_=>Root);
///
