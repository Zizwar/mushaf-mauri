import React, { Component } from "react";
import { Alert, Slider, Picker, Dimensions } from "react-native";
import { Updates } from "expo";
import {
  Container,
  Content,
  ListItem,
  Text,
  Left, // as Leftz,
  Right, // as Rightz,
  Body,
  Switch,
  Separator,
} from "native-base";
//import styles from "./styles";
import { connect } from "react-redux";
import * as lang from "../../i18n";

import { Icon } from "../component";
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
  setTheme,
} from "../../reducer";
import { Headerino } from "../component";
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
        items: [],
      },
      fontSize: 16,
    };
  }

  prorate_ = (val) => {
    const { prorate, setProrate } = this.props;
    //const night = prorate ? false : true;
    console.log({ prorate });
    setProrate(val);
    this.appReload();
    //  this.setReloadApp = true;
  };
  setAwk = (_) => {
    const { awk, setAwk } = this.props;
    console.log({ awk });
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
          style: "cancel",
        },
        {
          text: "OK",
          onPress: Updates.reload,
        },
      ],
      { cancelable: false }
    );
  };
  onValueChange = (lang) => {
    const { setLang, reRender } = this.props;
    setLang(lang);
    reRender("switchLang");
    this.setState({
      lang,
    });
    alert(lang);
    //setTimeout(_ => Updates.reload(), 1000);
  };
  onValueChangeLang = (id) => {
    console.log(id);
    if (!id) return;

    const { setLang, reRender } = this.props;

    const lang = id == "ar" ? id : "en";

    setLang(lang);
    reRender("switchLang");
    this.goBack();
    //reRender(true)
    //  this.appReload();
    //this.setReloadApp = true;
  };

  changeQuira = (id) => {
    console.log(id);
    if (id == "mosshaf_type") return;
    const { setQuira, setTheme } = this.props;
    setTheme({ backgroundColor: "#fff", color: "#000" });
    setQuira(id);
    //reRender(true)
    //this.appReload();
    this.goBack();
    // this.appReload();
    //this.setReloadApp = true;
  };
  renderItemPicker(option) {
    const text = this.lang["mosshaf_" + option];
    const label = text ? text : this.lang["mosshaf_type"];

    return <Picker.Item key={option} value={option} label={label} />;
  }
  renderItemPickerLang(option) {
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
    const {
      fontSize,
      setFontSize,
      awk,
      theme: { backgroundColor, color },
      lang,
    } = this.props;
    return (
      <Container
        style={
          {
            //   backgroundColor: "#FFF"
          }
        }
      >
        <Headerino
          onPress={() => this.goBack()}
          lang={lang}
          text={this.lang["options"]}
          color={color}
          backgroundColor={backgroundColor}
        />
        <Content style={{ backgroundColor }}>
          <ListItem>
            <Body>
              <Picker
                style={{ width: SCREEN_WIDTH - 20, color }}
                selectedValue={this.lang["choose_lang"]}
                onValueChange={this.onValueChangeLang}
              >
                {[
                  { name: "choose_lang", id: 0 },
                  { name: "l_english", id: "en" },
                  { name: "l_arabic", id: "ar" },
                ].map((option) => this.renderItemPickerLang(option))}
              </Picker>
            </Body>
          </ListItem>
          <ListItem>
            <Body>
              <Picker
                style={{ width: SCREEN_WIDTH - 20, color }}
                selectedValue={this.lang["mosshaf_type"]}
                onValueChange={this.changeQuira}
                // itemStyle={itemStyle}
              >
                {["mosshaf_type", "hafsMadina", "warsh"].map((option) =>
                  this.renderItemPicker(option)
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
              <Text style={{ color }}>{this.lang["setting_keeplight"]} </Text>
              <Left />
              <Body>
                <Switch color={color} onValueChange={this.setAwk} value={awk} />
                <Right />
              </Body>
            </Body>
          </ListItem>

          <Separator bordered />

          <ListItem>
            <Body>
              <Text style={{ fontSize, color }}>{this.lang["fontsize"]}</Text>
              <Slider
                style={{ alignSelf: "stretch", color }}
                value={fontSize / 32}
                onValueChange={(value) => {
                  const calc = value * 32;
                  const fontSize = calc < 9 ? 9 : calc;
                  setFontSize(fontSize);
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
  theme,
}) => ({
  theme,
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
  setTheme,
  setExactAya,
  setFontSize,
  setAuthor,
  setLang,
  setAwk,
  setMenu,
  setDownload,
  setOptions,
  setProrate,
  setQuira,
};
export default connect(mapStateToProps, mapDispatchToProps)(Options);
