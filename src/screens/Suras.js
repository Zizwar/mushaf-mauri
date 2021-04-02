import React, { Component } from "react";
import { Container, Content, List, ListItem, Text, Body } from "native-base";
import { isRTL } from "expo-localization";

import { Icon } from "../component";
import {
  allSuwar,
  getAllAyaSuraBySura,
  getJuzBySuraAya,
  getHizbBySuraAya,
  getPageBySuraAya,
} from "../functions";
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
import * as lang from "../../i18n";
import { Headerino } from "../component";

class Suras extends Component {
  constructor(props) {
    super(props);

    this.lang = lang[this.props.lang];
  }
  UNSAFE_componentWillMount() {
    this.allSuwar = allSuwar(this.props.lang);
  }
  goBack = () => this.props.navigation.goBack();

  onPressSura = (id) => {
    this.props.setExactAya({ aya: 1, sura: id });
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
          onPress={this.goBack}
          lang={lang}
          text={this.lang["sowar"]}
          color={color}
          //icon={"ios-menu"}
          backgroundColor={backgroundColor}
        />
        <Content style={{ backgroundColor }}>
          <List
            dataArray={this.allSuwar}
            renderRow={(data) => (
              <ListItem
                style={{ backgroundColor }}
                onPress={() => {
                  this.onPressSura(data.id);
                }}
              >
                <Body>
                  <Text
                    style={{
                      color,
                      textAlign: isRTL && lang !== "ar" ? "right" : null,
                      fontSize: 18,
                    }}
                  >
                    {`${data.id}. ${this.lang["sura_s"]} ${data.name}`}
                  </Text>
                  <Text
                    style={{
                      color,
                      textAlign: isRTL && lang !== "ar" ? "right" : null,
                    }}
                    note
                  >
                    {`${getAllAyaSuraBySura(data.id).length} ${
                      this.lang["aya_s"]
                    }, ${this.lang["juz"]} ${parseInt(
                      getJuzBySuraAya({ sura: data.id, aya: 1 }) / 4
                    )}, ${this.lang["hizb"]} ${getHizbBySuraAya({
                      sura: data.id,
                      aya: 1,
                    })}, ${this.lang["page"]} ${getPageBySuraAya({
                      sura: data.id,
                      aya: 1,
                    })}`}
                  </Text>
                </Body>
              </ListItem>
            )}
          />
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, lang, theme }) => ({
  wino,
  lang,
  theme,
});

const mapDispatchToProps = {
  setExactAya,
};
export default connect(mapStateToProps, mapDispatchToProps)(Suras);
