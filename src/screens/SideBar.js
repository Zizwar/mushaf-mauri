import React, { Component } from "react";
import {
  Image,
  Platform,
  Dimensions,
  StyleSheet,
  BackHandler
} from "react-native";
import {
  Content,
  Text,
  List,
  ListItem,
  Thumbnail,
  Container,
  Left,
  Right,
  Badge,
  View,
  Button,
  Icon,
  
} from "native-base";
import { connect } from "react-redux";
import * as lang from "../../i18n";

import * as FileSystem from "expo-file-system";
const DIR = FileSystem.documentDirectory;
const folderQuira = DIR + "warsh";
const LinkdrawerCover = folderQuira + "/3.png"
const drawerCover = /*{uri: LinkdrawerCover};*/ require(`../../assets/mauri.png`);

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shadowOffsetWidth: 1,
      shadowRadius: 4
    };
    this.lang = lang[this.props.lang];
    this.datas = [
      /*
  {
    name: this.lang["bu_browse"],
    route: "SearchSmart",
    icon: require("../../assets/search.png"),
   bg: "#477EEA",
      }, 
      */
      {
        name: this.lang["favs"],
        route: "BookMarks",
        icon: require("../../assets/bookmark.png"),
        bg: "#477EEA"
      },
      {
        name: this.lang["bu_tafaser"],
        route: "Tafsir",
        icon: require("../../assets/tafasir.png"),
        bg: "#477EEA"
      },
      {
        name: this.lang["bu_telawa"],
        route: "Reciting",
        icon: require("../../assets/repeat.png"),
        bg: "#477EEA"
      },
      {
        name: this.lang["alert_defTitle"],
        route: "Alarm",
        icon: require("../../assets/alarm.png"),
        bg: "#477EEA"
      },
      {
        name: this.lang["khitma"],
        route: "Khitma",
        icon: require("../../assets/khitma.png"),
        bg: "#477EEA"
      },
      {
        name: this.lang["options"],
        route: "Options",
        icon: require("../../assets/setting.png"),
        bg: "#477EEA"
      },
      {
        name: this.lang["bu_download_cnt"],
        route: "Store",
        icon: require("../../assets/addon.png"),
        bg: "#477EEA"
      }
    ];
  }

  render() {
    const { navigation } = this.props;
    return (
      <Container>
        <Content
          bounces={false}
          style={{ flex: 1, backgroundColor: "#fff", top: -1 }}
        >
          <View style={{ position: "absolute", top: 10, right: 5 }}>
            <Button transparent onPress={navigation.closeDrawer}>
              <Icon name="close" color="#555" />
            </Button>
          </View>

          <View style={{ margin: 20 }}>
      
            <Thumbnail
              large
              square
              source={drawerCover}
              style={styles.drawerCover}
            />
          </View>
          <List
            dataArray={this.datas}
            renderRow={data => (
              <ListItem
                button
                noBorder
                onPress={() => navigation.navigate(data.route)}
              >
                <Left>
                  <Thumbnail small square source={data.icon} />
                  <Text style={styles.text}>{data.name}</Text>
                </Left>
              </ListItem>
            )}
          />
{/*
          <ListItem button noBorder onPress={BackHandler.exitApp}>
            <Left>
              <Icon size={42} name="close" color="#d4aa1e" />
              <Text style={styles.text}>{this.lang["close"]}</Text>
            </Left>
          </ListItem>
          */}
        </Content>
        
      </Container>
    );
  }
}

const deviceHeight = Dimensions.get("window").height;
const deviceWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  drawerCover: {
    /*   height: null,
    width: 100,
    position: "relative",
    */
    marginBottom: 10,
    alignSelf: "center"
  },
  drawerImage: {
    position: "absolute",
    left: Platform.OS === "android" ? deviceWidth / 10 : deviceWidth / 9,
    top: Platform.OS === "android" ? deviceHeight / 13 : deviceHeight / 12,
    width: 210,
    height: 75,
    resizeMode: "cover"
  },
  text: {
    fontWeight: Platform.OS === "ios" ? "500" : "400",
    fontSize: 16,
    marginLeft: 20
  },
  badgeText: {
    fontSize: Platform.OS === "ios" ? 13 : 11,
    fontWeight: "400",
    textAlign: "center",
    marginTop: Platform.OS === "android" ? -3 : undefined
  }
});

const mapStateToProps = ({ lang }) => ({ lang });

const mapDispatchToProps = {};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SideBar);
//export default SideBar;

/*
  <Image source={drawerCover} style={styles.drawerCover} />
          <Image square style={styles.drawerImage} source={drawerImage} />
*/
