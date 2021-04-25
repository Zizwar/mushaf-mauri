import React from "react";
import { Root } from "native-base";
//import { StackNavigator, DrawerNavigator } from "react-navigation";
import {
  createDrawerNavigator,
  createStackNavigator,
  createAppContainer,
} from "react-navigation";

import Menu from "./src/screens/Menu";
import Wino from "./Wino";
import Author from "./src/screens/Author";
import Reciting from "./src/screens/Reciting";
import Tafsir from "./src/screens/Tafsir";
import BookMarks from "./src/screens/BookMarks";
import Options from "./src/screens/Options";
import Khitma from "./src/screens/Khitma";
//import Tray from "./src/screens/Tray";
//import Alarm from "./src/screens/Alarm";
import Store from "./src/screens/Store";
import StoreItem from "./src/screens/StoreItem";
import SearchSmart from "./src/screens/SearchSmart";
import Suras from "./src/screens/Suras";
//import Cloud from "./src/screens/Cloud";
//import Kids from "./src/screens/Kids";
//import Header from "./screens/Header/";
///
//import SideBar from "./src/screens/SideBar";
const Drawer = createDrawerNavigator(
  {
    BookMarks: { screen: BookMarks },
    Home: { screen: Menu },
    Tafsir: { screen: Tafsir },
    Wino: { screen: Wino },
    Khitma: { screen: Khitma },
    Author: { screen: Author },
    Reciting: { screen: Reciting },
    //Alarm: { screen: Alarm },
    Store: { screen: Store },
    StoreItem: { screen: StoreItem },
    //Cloud: { screen: Cloud },
  },
  {
    initialRouteName: "Wino",
    contentOptions: {
      activeTintColor: "#e91e63",
    },
    contentComponent: (props) => <Menu {...props} />,
  }
);
//
const AppNavigator = createStackNavigator(
  {
    Drawer: { screen: Drawer },
    BookMarks: { screen: BookMarks },
    Home: { screen: Menu },
    Tafsir: { screen: Tafsir },
    Wino: { screen: Wino },
    SearchSmart: { screen: SearchSmart },
    Suras: { screen: Suras },
    //Tray: { screen: Tray },
    Options: { screen: Options },
    Khitma: { screen: Khitma },
    Author: { screen: Author },
    Reciting: { screen: Reciting },
    //Alarm: { screen: Alarm },
    Store: { screen: Store },
    StoreItem: { screen: StoreItem },
    //Cloud: { screen: Cloud },
    // Kids:{screen:Kids},
  },
  {
    initialRouteName: "Drawer",
    headerMode: "none",
    mode: "modal",
  }
);
const AppContainer = createAppContainer(AppNavigator);
export default () => (
  <Root>
    <AppContainer />
  </Root>
);
