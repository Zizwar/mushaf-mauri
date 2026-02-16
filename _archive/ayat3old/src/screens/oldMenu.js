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
  Body
} from "native-base";
import { connect } from "react-redux";
import * as lang from "../../i18n";

const drawerCover = /*{uri: LinkdrawerCover};*/ require(`../../assets/ayat.png`);

class Menu extends Component {
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
        name: this.lang["tafsir"],
        route: "Tafsir",
        icon: "document",
        bg: "#477EEA"
      },
	  {
        name: this.lang["favs"],
        route: "BookMarks",
        icon:"bookmark",
        bg: "#477EEA"
      },
 
      {
        name: this.lang["bu_download_recites"],
        route: "author",
        icon: "headset",
        bg: "#477EEA"
      },
	  
      {
        name: this.lang["color"],
        route: "color",
        icon: "color-fill",
        bg: "#477EEA"
      },
      {
        name: this.lang["khitma"],
        route: "Khitma",
        icon: "timer",
        bg: "#477EEA"
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
        bg: "#477EEA"
      }
    ];
  }

  render() {
    const { navigation, backgroundColor, authorModal,color,changeColor, close ,lang} = this.props;
    return (
      <Content style={{ flex: 1, backgroundColor: "#ffffff00" }}>
        <List
          transparent
          dataArray={this.datas}
          renderRow={data => (
            <ListItem

              noBorder
				style={{height:42}}		
	transparent 	
		
	//iconRight={lang==="ar"?null:true} iconLeft={lang==="ar"?true:null}
              onPress={() => {
				switch (data.route) {
      case "color":return changeColor();
	  case "author":return authorModal("open");
      default: {
                navigation.navigate(data.route);
                close();
                  }
              }}
			  }			  
		
    >



			  {lang==="ar" &&       
				<Text style={ { color }}>{data.name}</Text>
			  }
                <Icon size={26} name={data.icon} style={{color,paddingLeft:15}}/>  
					{lang!=="ar" &&       
				<Text style={ { color }}>{data.name}</Text>
			  }

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
  textAr: {
    fontWeight: Platform.OS === "ios" ? "500" : "400",
    fontSize: 15,
    marginRight: 20,
    marginLeft: 20
  },
  textEn: {
    fontWeight: Platform.OS === "ios" ? "500" : "400",
    fontSize: 15,
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
export default connect(mapStateToProps, mapDispatchToProps)(Menu);
//export default SideBar;

/*
  <Image source={drawerCover} style={styles.drawerCover} />
          <Image square style={styles.drawerImage} source={drawerImage} />
*/
