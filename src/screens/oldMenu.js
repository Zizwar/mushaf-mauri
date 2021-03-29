import React, { Component } from "react";
import { Dimensions } from "react-native";
import { Content, Text, List, ListItem } from "native-base";

import { Icon } from "../component";
import { connect } from "react-redux";
import * as lang from "../../i18n";

class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shadowOffsetWidth: 1,
      shadowRadius: 4,
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
        name: this.lang["tafsir"],
        route: "Tafsir",
        icon: "document",
        bg: "#477EEA",
      },
      {
        name: this.lang["favs"],
        route: "BookMarks",
        icon: "bookmark",
        bg: "#477EEA",
      },

      {
        name: this.lang["bu_download_recites"],
        route: "author",
        icon: "headset",
        bg: "#477EEA",
      },

      {
        name: this.lang["color"],
        route: "color",
        icon: "color-fill",
        bg: "#477EEA",
      },
      {
        name: this.lang["khitma"],
        route: "Khitma",
        icon: "timer",
        bg: "#477EEA",
      },
      /*
      {
        name: this.lang["options"],
        route: "Options",
        icon: require("../../assets/setting.png"),
        bg: "#477EEA"
      },
	  */
      {
        name: this.lang["bu_download_cnt"],
        route: "Store",
        icon: "cloud-download",
        bg: "#477EEA",
      },
    ];
  }

  render() {
    const {
      navigation,
      authorModal,
      color,
      changeColor,
      close,
      lang,
    } = this.props;
    return (
      <Content style={{ flex: 1, backgroundColor: "#ffffff00" }}>
        <List
          transparent
          dataArray={this.datas}
          renderRow={(data) => (
            <ListItem
              noBorder
              style={{ height: 42 }}
              transparent
              //iconRight={lang==="ar"?null:true} iconLeft={lang==="ar"?true:null}
              onPress={() => {
                switch (data.route) {
                  case "color":
                    return changeColor();
                  case "author":
                    return authorModal("open");
                  default: {
                    navigation.navigate(data.route);
                    close();
                  }
                }
              }}
            >
              {lang === "ar" && <Text style={{ color }}>{data.name}</Text>}
              <Icon
                size={26}
                name={data.icon}
                style={{ color, paddingLeft: 15 }}
              />
              {lang !== "ar" && <Text style={{ color }}>{data.name}</Text>}
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
    );
  }
}


const mapStateToProps = ({ lang }) => ({ lang });

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(Menu);
//export default SideBar;

/*
  <Image source={drawerCover} style={styles.drawerCover} />
          <Image square style={styles.drawerImage} source={drawerImage} />
*/
