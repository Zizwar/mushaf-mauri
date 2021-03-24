//console.ignoredYellowBox = ['Warning: Each', 'Warning: Failed'];
console.disableYellowBox = true;

//
import Expo, { Asset,AppLoading } from "expo";
import * as Font from 'expo-font'
import React, { Component } from "react";
import { AsyncStorage } from "react-native";
import { StyleProvider } from "native-base";
//
import { createStore, applyMiddleware } from "redux";
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
      nightly:false
    };
  }

  componentDidMount() {
    this.loadDadaApp();
  }
  async loadDadaApp() {
    try {
     const value = await AsyncStorage.getItem("isNightly");
    //  if(value === "ok")variablesZ = variablesNight
  //    const nightly = value == "ok" ? true : false;

      await Font.loadAsync({
       // Roboto: require("native-base/Fonts/Roboto.ttf"),
       // Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
	    Roboto: require("./assets/fonts/pnu.ttf"),
        Roboto_medium: require("./assets/fonts/pnu-med.ttf"),
       //Ionicons: require('@expo/vector-icons'),
       Ionicons: require("native-base/Fonts/Ionicons.ttf")
      });

      this.setState({ isReady: true });
    } catch (error) {
      alert("####error LoadAsync Font Isnight==>" + error);
      this.setState({ isReady: true });
    }
  }

  render() {
    if (!this.state.isReady) {
      return <AppLoading />;
    }
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
///
