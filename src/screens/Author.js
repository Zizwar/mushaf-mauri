import React, { Component } from "react";
import { Container, Content, List } from "native-base";
import { connect } from "react-redux";

import { listVoiceMoqri } from "../data";

import { setAuthorMoqri, setPlayer } from "../../reducer";
import * as lang from "../../i18n";
import { Itemino, Headerino } from "../component";
class Author extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
  }
  UNSAFE_componentWillMount() {
    this.listAutor = listVoiceMoqri(this.lang);
  }
  goBack = () => {
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
      theme: { backgroundColor, color },
      lang,
    } = this.props;
    return (
      <Container style={{ backgroundColor }}>
        <Headerino
          onPress={() => this.goBack()}
          lang={lang}
          text={this.lang["bu_download_recites"]}
          color={color}
          backgroundColor={backgroundColor}
        />

        <Content>
          <List
            dataArray={this.listAutor}
            renderRow={(data, _i, index) => (
              <Itemino
                onPress={() => {
                  this.onPressAuthor(data.id);
                }}
                lang={lang}
                color={color}
                text={data.voice}
                icon={"arrow-back"}
                key={"auth"+index}
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
