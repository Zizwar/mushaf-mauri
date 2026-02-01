import React, { Component } from "react";

import { Dimensions, StyleSheet } from "react-native";

import {
  CardItem,
  Card,
  Text,
  Right,
  Content,
  Header,
  Left,
  Grid,
  Col,
  Body,
  Title,
  Container,
  Button,
} from "native-base";
import ModalSelector from "react-native-modal-selector";
import { connect } from "react-redux";
import { calcKhitma } from "../functions";

import { Icon } from "../component";

import { setExactAya, setKhitma } from "../../reducer";
import * as lang from "../../i18n";

class Khitma extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vi: [], //[...Array(NUMBER_PAGE).keys()]
      juz: null,
      day: null,
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
    let resault = calcKhitma({ juz, day });
    const calcTextJuz = this.calcTextJuz({
      rob3: resault.rob3,
      juz: resault.juz,
    });
    resault.calcTextJuz = calcTextJuz;
    this.setState({ resault });
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
      alert("اتممت الختمة");
      // wino.stor.khitma.selection = 1;
      // wino.stor.actifKhitma = false;
      // setStor("khitmaAktif", false);
      // khitmaActif.dispose();
      // pageKhitma.dispose();
      // alertDown("اتممت الختمة")
      //closeAllPage();
      this.setState({ ok: false, resault: {} });

      this.props.setKhitma({});

      return;
    }
    resault.playRob3 = endRob3;
    resault.endRob3 = endRob3 + rob3Day;
    resault.selection = selection + 1;
    resault = calcKhitma({ res: resault });
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
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };

  render() {
    const LIST_DAY = this.listDay.map((label, key) => ({ key, label }));
    const LIST_JUZ = this.listJuz.map((label, key) => ({ key, label }));
    const { resault } = this.state;

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this.goBack}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>{this.lang["khitma"]}</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          {!this.state.ok ? (
            <Card>
              <CardItem>
                <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                  <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                    <Text style={{ alignSelf: "center" }}>Day :</Text>
                    <ModalSelector
                      data={LIST_DAY}
                      initValue="Chose"
                      onChange={(option) => {
                        this.setState({ day: option.label });
                        // this.onChangeModal();
                      }}
                    />
                  </Col>
                </Grid>
                <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                  <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                    <Text style={{ alignSelf: "center" }}>Juz :</Text>
                    <ModalSelector
                      data={LIST_JUZ}
                      initValue="Chose"
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
                      style={{ borderWidth: 1 }}
                      block
                      iconRight
                      transparent
                    >
                      <Text>Calc Werd </Text>
                      <Icon name="ios-calculator-outline" />
                    </Button>
                  </Col>
                </Grid>
                {resault && (
                  <Card>
                    <CardItem>
                      <Body>
                        <Text style={{ alignSelf: "center" }}>
                          {this.lang["kemWerd"]}:{resault.calcTextJuz}{" "}
                        </Text>
                      </Body>
                    </CardItem>
                    <CardItem bordered>
                      <Text>{resault.textFull} </Text>
                    </CardItem>
                  </Card>
                )}
                {resault && (
                  <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                    <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                      <Button
                        onPress={(_) => {
                          this.setState({ ok: true });
                          this.props.setKhitma(resault);
                        }}
                        style={{ borderWidth: 1 }}
                        block
                        iconRight
                      >
                        <Text>Accept </Text>
                        <Icon name="md-checkmark-circle-outline" />
                      </Button>
                    </Col>
                  </Grid>
                )}
              </CardItem>
            </Card>
          ) : (
            <Card>
              <CardItem>
                {resault && (
                  <Card>
                    <CardItem>
                      <Body>
                        <Text style={{ alignSelf: "center" }}>
                          {this.lang["kemWerd"]}{" "}
                        </Text>
                      </Body>
                    </CardItem>
                    <CardItem bordered>
                      <Text>{resault.textFull} </Text>
                    </CardItem>
                  </Card>
                )}

                <Grid style={{ marginTop: 20, marginBottom: 10 }}>
                  <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                    <Button transparent onPress={this.next} block iconLeft>
                      <Icon name="arrow-dropright-circle" />
                      <Text> Next</Text>
                    </Button>
                  </Col>
                  <Col style={{ paddingLeft: 5, paddingRight: 10 }}>
                    <Button
                      onPress={this.play}
                      style={{ borderWidth: 1 }}
                      block
                      iconRight
                    >
                      <Text>Play </Text>
                      <Icon name="ios-play" />
                    </Button>
                  </Col>
                </Grid>
              </CardItem>
            </Card>
          )}
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = ({ khitma, wino, lang }) => ({
  lang,
  // repoInfo,
  khitma,
  wino,
});

const mapDispatchToProps = {
  setExactAya,
  setKhitma,
};
export default connect(mapStateToProps, mapDispatchToProps)(Khitma);
