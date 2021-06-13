import React, { Component } from "react";

import { Dimensions, StyleSheet } from "react-native";

import {
  CardItem,
  Card,
  Text,
  Content,
  Grid,
  Col,
  Body,
  Container,
  Button,
  Toast,
} from "native-base";

import { Icon } from "../component";
import { getAyatBySuraAya, calcKhitma, getNameBySura } from "../functions";
import { ScreenAya, Headerino } from "../component";
//import ModalSelector from "react-native-modal-selector";
import ModalSelector from "../node/modal-selector"
import { connect } from "react-redux";
import { setExactAya, setKhitma } from "../../reducer";
import * as lang from "../../i18n";

class Khitma extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vi: [], //[...Array(NUMBER_PAGE).keys()]
      juz: 1,
      day: 3,
      resault: null,
    };
    this.lang = lang[this.props.lang];
    this.listDay = [];
    this.listJuz = [];
  }
  UNSAFE_componentWillMount() {
    const { khitma } = this.props;
    if (khitma && khitma.ok) this.setState({ resault: khitma, ok: true });

    this.listDay = this.range(3, 240);
    this.listJuz = this.range(1, 30);
  }

  //  //
  //
  range = (start, end) => {
    let foo = [];
    let i;
    for (i = start; i <= end; i++) {
      foo.push(i);
    }
    return foo;
  };
  //
  calcTextJuz = ({ juz, rob3 }) => {
    //console.log("calcTextJuz:", { juz, rob3 });
    const juzText = this.lang["juzKhitma"][juz];
    const rob3Text = this.lang["rob3Khitma"][rob3];
    const and = juz == 0 || 0 == rob3 ? "" : " " + this.lang["and"] + " ";
    const text = "\n" + juzText + and + rob3 ? rob3Text : "";
    return text;
  };
  onChangeModal = () => {
    const { juz, day } = this.state;
    if (juz === null || day === null) {
      alert("select juz or day");
      return;
    }
    const { lang } = this.props;
    let resault = calcKhitma({ juz, day, lang, _lang: this.lang });
    const calcTextJuz = this.calcTextJuz({
      rob3: resault.rob3,
      juz: resault.juz,
    });
    resault.calcTextJuz = calcTextJuz;
    // this.setState({ resault });

    this.setState({ ok: true, resault });
    this.props.setKhitma(resault);
  };
  play = () => {
    const { starSura: sura, starAya: aya } = this.state.resault;
    this.props.setExactAya({ sura, aya });
    this.goBack();
  };
  next = (_) => {
    let { resault } = this.state;
    let { rob3Day, endRob3, day, selection } = resault;

    if (selection >= day - 1) {
      // alert();
      // wino.stor.khitma.selection = 1;
      // wino.stor.actifKhitma = false;
      // setStor("khitmaAktif", false);
      // khitmaActif.dispose();
      // pageKhitma.dispose();

      Toast.show({
        text: this.lang["doneKhitma"],
        type: "success",
        duration: 3000,
      });
      //closeAllPage();
      this.setState({ ok: false, resault: null, juz: 1, day: 3 });

      this.props.setKhitma({});

      return;
    }
    resault.playRob3 = endRob3;
    resault.endRob3 = endRob3 + rob3Day;
    resault.selection = selection + 1;

    const { lang } = this.props;
    //  let resault = calcKhitma({ juz, day });
    resault = calcKhitma({ res: resault, lang, _lang: this.lang });
    //const { rob3,juz } = resault;
    const calcTextJuz = this.calcTextJuz({
      rob3: resault.resault,
      juz: resault.juz,
    });
    resault.calcTextJuz = calcTextJuz;

    console.log({ resault });
    this.setState({ resault, ok: true });
    this.props.setKhitma(resault);
  };

  goBack = () => {
    this.props.navigation.goBack();
  };

  render() {
    const LIST_DAY = this.listDay.map((label, key) => ({ key, label }));
    const LIST_JUZ = this.listJuz.map((label, key) => ({ key, label }));
    const { resault, day, juz, ok } = this.state;
    const {
      lang,
      fontSize,
      theme: { backgroundColor, color },
    } = this.props;

    return (
      <Container style={{ backgroundColor }}>
        <Headerino
          onPress={() => this.goBack()}
          lang={lang}
          text={this.lang["khitma"]}
          color={color}
          backgroundColor={backgroundColor}
        />

        <Content>
          {!ok && (
            <Card style={{ backgroundColor }}>
              <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Text style={{ alignSelf: "center", color }}>
                    {this.lang["dayKhitma"]}
                  </Text>
                  <ModalSelector
                    data={LIST_DAY}
                    initValue={day+""}
                    onChange={(option) => {
                      this.setState({ day: option.label });
                      // this.onChangeModal();
                    }}
                  />
                </Col>
              </Grid>
              <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Text style={{ alignSelf: "center", color }}>
                    {this.lang["chooseJuz"]}
                  </Text>
                  <ModalSelector
                    data={LIST_JUZ}
                    initValue={juz+""}
                    onChange={(option) => {
                      this.setState({ juz: option.label });
                      // this.onChangeModal();
                    }}
                    // supportedOrientations={["landscape"]}
                    // accessible={true}
                    // scrollViewAccessibilityLabel={"Scrollable options"}
                    // cancelButtonAccessibilityLabel={"Cancel Button"}
                  />
                </Col>
              </Grid>
              <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Button
                    onPress={this.onChangeModal}
                    style={{ borderWidth: 1, backgroundColor: color }}
                    block
                    iconRight
                  >
                    <Text style={{ color: backgroundColor }}>
                      {this.lang["calcWerd"]}{" "}
                    </Text>
                  </Button>
                </Col>
              </Grid>
            </Card>
          )}
          {resault && (
            <Card>
              <CardItem>
                <Body>
                  <Text style={{ alignSelf: "center" }}>
                    {this.lang["kemWerd"]}: {resault.calcTextJuz}
                  </Text>
                </Body>
              </CardItem>
              <CardItem>
                <Body>
                  <Text style={{ alignSelf: "center" }}>
                    {this.lang["txtFromAya"]}
                  </Text>
                </Body>
              </CardItem>
              <ScreenAya
                color={color}
                backgroundColor={backgroundColor}
                aya={this.lang["aya_s"] + " " + resault.starAya}
                text={
                  getAyatBySuraAya({
                    sura: resault.starSura,
                    aya: resault.starAya,
                  }).text
                }
                sura={
                  this.lang["sura_s"] +
                  " " +
                  getNameBySura({ sura: resault.starSura, lang })
                }
                page={
                  getAyatBySuraAya({
                    sura: resault.starSura,
                    aya: resault.starAya,
                  }).page
                }
                page={
                  this.lang["enterPageNum"] +
                  " " +
                  getAyatBySuraAya({
                    sura: resault.starSura,
                    aya: resault.starAya,
                  }).page
                }
                fontSize={fontSize}
              />
              <CardItem>
                <Body>
                  <Text style={{ alignSelf: "center" }}>
                    {this.lang["txtToAya"]}
                  </Text>
                </Body>
              </CardItem>

              <ScreenAya
                color={color}
                backgroundColor={backgroundColor}
                aya={this.lang["aya_s"] + " " + resault.endAya}
                text={
                  getAyatBySuraAya({
                    sura: resault.endSura,
                    aya: resault.endAya,
                  }).text
                }
                sura={
                  this.lang["sura_s"] +
                  " " +
                  getNameBySura({ sura: resault.endSura, lang })
                }
                page={
                  this.lang["enterPageNum"] +
                  " " +
                  getAyatBySuraAya({
                    sura: resault.endSura,
                    aya: resault.endAya,
                  }).page
                }
                fontSize={fontSize}
              />

              <Button
                style={{ backgroundColor: color }}
                onPress={this.next}
                block
              >
                <Text style={{ color: backgroundColor }}>
                  {" "}
                  {this.lang["alert_next"]}
                </Text>
              </Button>
              <Button style={{ backgroundColor }} onPress={this.play} block>
                <Text style={{ color }}>{this.lang["play"]} </Text>
              </Button>
            </Card>
          )}
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = ({ khitma, wino, lang, fontSize, theme }) => ({
  lang,
  fontSize,
  // repoInfo,
  theme,
  khitma,
  wino,
});

const mapDispatchToProps = {
  setExactAya,
  setKhitma,
};
export default connect(mapStateToProps, mapDispatchToProps)(Khitma);
