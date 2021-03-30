import React, { Component } from "react";
import { Content, List, View, Container } from "native-base";
import { connect } from "react-redux";

import * as lang from "../../i18n";

import { Itemino } from "../component";
import AuthorMenu from "./AuthorMenu";
import { setLang, reRender, setQuira, setTheme } from "../../reducer";
class Menu extends Component {
  constructor(props) {
    super(props);

    this.lang = lang[this.props.lang];
    this.menus = [
      {
        name: this.lang["tafsir"],
        route: "Tafsir",
        icon: "md-document",
        bg: "#477EEA",
      },
      {
        name: this.lang["favs"],
        route: "BookMarks",
        icon: "md-bookmark",
        bg: "#477EEA",
      },

      {
        name: this.lang["bu_download_recites"],
        route: "author",
        icon: "md-headset",
        bg: "#477EEA",
      },
      {
        name: this.lang["mosshaf_type"],
        route: "mushaf",
        icon: "md-book",
      },
      {
        name: this.lang["color"],
        route: "color",
        icon: "md-color-fill",
        bg: "#477EEA",
      },
      {
        name: this.lang["choose_lang"],
        route: "choose_lang",
        icon: "md-flag",
        bg: "#477EEA",
      },
      {
        name: this.lang["bu_download_cnt"],
        route: "Store",
        icon: "md-cloud-download",
        bg: "#477EEA",
      },
    ];
    this.dataMushaf = ["warsh"];
    this.themes = [
      { backgroundColor: "#ccc", color: "#000", night: true }, //night
      { backgroundColor: "#fff", color: "#000" }, //sandart
      { backgroundColor: "#fffcd9", color: "#000" },
      { backgroundColor: "#e8f7fe", color: "#369" },
      { backgroundColor: "#e7f7ec", color: "#009" },
    ];
    this.theme = 0;
    this.state = {
      active: "menu",
    };
  }
  backMenu = () => this.setState({ active: "menu" });
  author = () => this.setState({ active: "author" });
  shooselang = () => this.setState({ active: "lang" });
  changeMushaf = () => this.setState({ active: "mushaf" });
  switchLangTo = (lang) => {
    const { setLang, reRender, close } = this.props;
    setLang(lang);
    reRender("switchLang");
    close();
  };
  render() {
    const {
      navigation,
      setQuira,
      close,
      lang,
      setTheme,
      theme: { backgroundColor, color },
    } = this.props;
    const { active } = this.state;
    const changeColor = (index) => {
      if (index) {
        setTheme(this.themes[index - 1]);
        return;
      }
      this.theme++;
      if (this.theme >= this.themes.length - 1) this.theme = 1;
      setTheme(this.themes[this.theme]);
    };
    const BackMenu = (
      <Itemino
        onPress={this.backMenu}
        lang={lang}
        backgroundColor={backgroundColor}
        color={color}
        text={this.lang["menu_hint"]}
        icon="md-arrow-back"
        iconSize={36}
        height={50}
        key={"mback"}
      />
    );

    const ListMenu = (
      <List
        transparent
        dataArray={this.menus}
        renderRow={(data, i, index) => (
          <Itemino
            onPress={() => {
              switch (data.route) {
                case "color":
                  return changeColor();
                case "mushaf":
                  return this.changeMushaf();
                case "author":
                  return this.author();
                case "choose_lang":
                  return this.shooselang();
                default: {
                  navigation.navigate(data.route);
                  close();
                }
              }
            }}
            lang={lang}
            color={color}
            text={data.name}
            icon={data.icon}
            noborder={true}
            key={`menu_${index}`}
          />
        )}
      />
    );

    const ListMushaf = (
      <View>
        <BackMenu />
        <List
          transparent
          dataArray={this.dataMushaf}
          renderRow={(data, i, index) => (
            <Content style={{ flex: 1, backgroundColor }}>
              <Itemino
                onPress={() => {
                  // setTheme({ backgroundColor: "#fff", color: "#000" });
                  setQuira(data);

                  // close();
                }}
                lang={lang}
                color={color}
                text={this.lang[`mosshaf_${data}`]}
                index={index + 1}
                key={`mus_${index}`}
                noborder={true}
              />
            </Content>
          )}
        />
      </View>
    );
    const ListLang = (
      <Content style={{ flex: 1, backgroundColor }}>
        <BackMenu />
        <Itemino
          onPress={() => this.switchLangTo("ar")}
          lang={lang}
          color={color}
          text={this.lang["l_arabic"]}
          index={1}
          key={`lng_${1}`}
          noborder={true}
        />
        <Itemino
          onPress={() => this.switchLangTo("en")}
          lang={lang}
          color={color}
          text={this.lang["l_english"]}
          index={2}
          key={`lng_${2}`}
          noborder={true}
        />
      </Content>
    );

    switch (active) {
      case "menu":
        return ListMenu;
      case "lang":
        return ListLang;
      case "mushaf":
        return ListMushaf;

      case "author":
        return (
          <Content style={{ flex: 1, backgroundColor }}>
            <AuthorMenu close={close} back={BackMenu} />
          </Content>
        );

      default:
        return ListMenu;
    }
  }
}

const mapStateToProps = ({ lang, theme }) => ({ lang, theme });

const mapDispatchToProps = { reRender, setLang, setQuira, setTheme };
export default connect(mapStateToProps, mapDispatchToProps)(Menu);
