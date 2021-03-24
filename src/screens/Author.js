import React, { Component } from "react";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Icon,
  List,
  ListItem,
  H3,
  Text,
  Left,
  Right,
  Body,
} from "native-base";

import { isRTL } from "expo-localization";
import { listVoiceMoqri } from "../data";
import { connect } from "react-redux";
import { setAuthorMoqri, setPlayer } from "../../reducer";
import * as lang from "../../i18n";
import { Itemino,Headerino } from "../component";
class Author extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
  }
  UNSAFE_componentWillMount() {
    this.listAutor = listVoiceMoqri(this.lang);
  }
  goBack = (arg) => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  onPressAuthor = (id) => {
    const { setAuthorMoqri, setPlayer, moqri } = this.props;
    if (id === moqri) return;
    setAuthorMoqri(id);
    setPlayer("play");
    this.goBack(true);
  };

  render() {
    const {
      togl,
      moqri,
      theme: { backgroundColor, color },
      lang,
    } = this.props;
    return (
      <Container style={{ backgroundColor }}>
            <Headerino onPress={() => this.goBack()} lang={lang} text={this.lang["bu_download_recites"]} color={color} backgroundColor={backgroundColor}  />
       
      
        <Content>
          <List
            dataArray={this.listAutor}
            renderRow={(data) => (
              <Itemino
                onPress={() => {
                  this.onPressAuthor(data.id);
                }}
                lang={lang}
                color={color}
                text={data.voice}
                icon={"arrow-back"}
              />
            )}
          />
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, lang, moqri, theme }) => ({
  wino,
  lang,
  moqri,
  theme,
});

const mapDispatchToProps = {
  setPlayer,
  setAuthorMoqri,
};
export default connect(mapStateToProps, mapDispatchToProps)(Author);
