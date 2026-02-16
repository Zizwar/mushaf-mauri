import React, { Component } from "react";
import {
  Platform,
  Alert,
  Slider,
  Picker,
  Dimensions
} from "react-native";
import { Updates } from "expo";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Icon,
  ListItem,
  Card,
  Text,
  CheckBox,
  Badge,
  Left, // as Leftz,
  Right, // as Rightz,
  Body,
  Switch,
  View,
  Radio,
  Separator
} from "native-base";
import SimplePicker from "react-native-simple-picker";
//import styles from "./styles";
import * as lang from "../../i18n";
import { connect } from "react-redux";
import {
  setExactAya,
  setAuthor,
  setLang,
  setAwk,
  setMenu,
  setDownload,
  setQuira,
  setOptions,
  setProrate,
  setFontSize,
	  reRender,
} from "../../reducer";

const SCREEN_WIDTH = Dimensions.get("window").width;
//let Right=Rightz;
//let Left = Leftz;
class Options extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
    this.state = {
      selectedItem: undefined,
      lang: this.props.lang,
      isprorate: this.props.prorate,
      results: {
        items: []
      },
      fontSize: 16
    };
  }
  componentWillMount() {
   // if (this.props.lang == "ar")
      //	Right = Leftz;
      //	Left = Rightz;
  }




  prorate_ = val => {
    const { prorate, setProrate } = this.props;
    //const night = prorate ? false : true;
    console.log({ prorate });
    setProrate(val);
    this.appReload();
    //  this.setReloadApp = true;
  };
    setAwk = _ => {
    const { awk, setAwk } = this.props;
    console.log({ awk});
    setAwk(!awk);
    //  this.setReloadApp = true;
  };
 
  appReload = () => {
    Alert.alert(
      "Reload",
      this.lang["confirm_restartApp"],
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "OK",
          onPress: Updates.reload
        }
      ],
      { cancelable: false }
    );
  };
  onValueChange = lang => {
	  const {setLang,reRender} = this.props;
    setLang(lang);
	reRender("switchLang");
    this.setState({
      lang
    });
    alert(lang);
    //setTimeout(_ => Updates.reload(), 1000);
  };
  onValueChangeLang = id => {
    console.log(id);
    if (!id) return;

    const {setLang,reRender} = this.props;
    

    const lang = id == "ar" ? id : "en";

    setLang(lang);
	reRender("switchLang");
	this.goBack()
    //reRender(true)
  //  this.appReload();
    //this.setReloadApp = true;
  };

  changeQuira = id => {
    console.log(id);
    if (id == "mosshaf_type") return;
    const { setQuira } = this.props;

    setQuira(id);
    //reRender(true)
    //this.appReload();
   this.goBack();
   // this.appReload();
    //this.setReloadApp = true;
  };
  renderItemPicker(option, index) {
    const text = this.lang["mosshaf_" + option];
    const label = text ? text : this.lang["mosshaf_type"];

    return <Picker.Item key={option} value={option} label={label} />;
  }
  renderItemPickerLang(option, index) {
    const text = this.lang[option.name];
    const label = text ? text : this.lang["choose_lang"];

    return <Picker.Item key={option.name} value={option.id} label={label} />;
  }
  //
  goBack = () => {
    if (this.setReloadApp) this.appReload();
    else this.props.navigation.goBack();
  };
  render() {
    const { navigation, prorate,fontSize,setFontSize,awk } = this.props;
    //const { fontSize } = this.state;
    const br = (
      <View
        style={{
          borderBottomColor: "#ccc",
          borderBottomWidth: 2
        }}
      />
    );
    return (
      <Container
        style={
          {
            //   backgroundColor: "#FFF"
          }
        }
      >
        <Header>
          <Left>
            <Button transparent onPress={this.goBack}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>{this.lang["options"]}</Title>
          </Body>
          <Right />
        </Header>

        <Content>
          <ListItem>
            <Body>
              <Picker
                style={{ width: SCREEN_WIDTH - 20 }}
                selectedValue={this.lang["choose_lang"]}
                onValueChange={this.onValueChangeLang}
              >
                {[
                  { name: "choose_lang", id: 0 },
                  { name: "l_english", id: "en" },
                  { name: "l_arabic", id: "ar" }
                ].map((option, index) =>
                  this.renderItemPickerLang(option, index)
                )}
              </Picker>
            </Body>
          </ListItem>
          <ListItem>
            <Body>
              <Picker
                style={{ width: SCREEN_WIDTH - 20 }}
                selectedValue={this.lang["mosshaf_type"]}
                onValueChange={this.changeQuira}
                // itemStyle={itemStyle}
              >
                {["mosshaf_type", "hafs", "hafsDorar","hafsShohbah","hafsAlsose",/*"warsh", "tajweed",*/].map(
                  (option, index) => this.renderItemPicker(option, index)
                )}
              </Picker>
            </Body>
          </ListItem>
	  {/*
          <ListItem>
            <Body>
              <Text>{this.lang["vision_night"]} </Text>
               <Left/>
              <Body>
                              <Switch onValueChange={this.prorate_} value={prorate} />
                <Right/>
                 </Body>
            </Body>
          </ListItem>
*/}
          <Separator bordered />
			   <ListItem>
            <Body>
              <Text>{this.lang["setting_keeplight"]} </Text>
               <Left/>
              <Body>
                              <Switch onValueChange={this.setAwk} value={awk} />
                <Right/>
                 </Body>
            </Body>
          </ListItem>

          <Separator bordered />

          <ListItem>
            <Body>
              <Text style={{ fontSize }}>{this.lang["fontsize"]}</Text>
              <Slider
                style={{ alignSelf: "stretch" }}
                value={fontSize / 32}
                onValueChange={value => {
                  const calc = value * 32;
                  const fontSize = calc < 9 ? 9 : calc;
                  setFontSize( fontSize );
                }}
              />
            </Body>
          </ListItem>
{/*
          <ListItem icon>
            <Left />
            <Body>
              <Text>Offline</Text>
            </Body>
            <Right>
              <Switch trackColor="#ccc" />
            </Right>
          </ListItem>
          <ListItem icon onPress={_ => navigation.navigate("Cloud")}>
            <Body>
              <Text>Backup</Text>
            </Body>
            <Right>
              <Text>(Import/Export)</Text>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          */}
        </Content>
       </Container>
    );
  }
}

const mapStateToProps = ({
  wino,
  lang,
  awk,
  download,
  menu,
  options,
  prorate,
  quira,
  fontSize,
}) => ({
  wino,
  download,
  awk,
  lang,
  menu,
  options,
  prorate,
  quira,
  fontSize,
});

const mapDispatchToProps = {
	reRender,
  setExactAya,
  setFontSize,
  setAuthor,
  setLang,
  setAwk,
  setMenu,
  setDownload,
  setOptions,
  setProrate,
  setQuira
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Options);
