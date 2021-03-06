//import Expo, { FileSystem as FS, Asset, SQLite } from "expo";
import React, { Component } from "react";
import { ActivityIndicator } from "react-native";
import {
  Container,
  Header,
  Content,
  Button,
  List,
  ListItem,
  Body,
  Card,
  Left,
  Right,
  Text,
} from "native-base";
import { connect } from "react-redux";
import SimplePicker from "react-native-simple-picker";
 
import { Icon } from "../component";

import { setTarjama, reRender } from "../../reducer";
import * as lang from "../../i18n";
import { listAuthorTarajem } from "../data";
class Tarajem extends Component {
  /**wino**/
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];

    this.options = listAuthorTarajem.map((t) => t.id);
    this.labels = listAuthorTarajem.map((t) => t.name);
  }

  goBack = () => {
    const { togl } = this.props;
    if (togl) togl("close");
  };
  /*
  changeTarjama = (id) => {
    const { setTarjama,nextAya,prevAya} = this.props;
    setTarjama(id);
    nextAya();
    prevAya();
   
  };
  */
  render() {
    const {
      nextAya,
      prevAya,
      isPlaying,
      wino: { aya },
      toglPlayer,
      text,
      togl,
      changeTarjama,
      theme: { color, backgroundColor },
      tarjama,
      loadingSound,
    } = this.props;

    return (
      <Container style={{ backgroundColor }}>
        <Header style={{ backgroundColor: color }}>
          <Left>
            <Button transparent onPress={() => togl("close")}>
              <Icon
                size={24}
                style={{ color: backgroundColor }}
                name="ios-arrow-down"
              />
            </Button>
          </Left>
          <Body>
            <Button
              transparent
              iconLeft
              onPress={() => {
                this.refs.picker.show();
              }}
            >
              <Icon
                size={24}
                style={{ color: backgroundColor }}
                name="md-create"
              />
              <Text style={{ color: backgroundColor, fontSize: 11 }} note>
                {listAuthorTarajem.filter((itm) => itm.id === tarjama)[0].name}
              </Text>
            </Button>
          </Body>

          <Button transparent onPress={prevAya}>
            <Icon
              size={24}
              style={{ color: backgroundColor }}
              name="play-skip-back-circle-sharp"
            />
          </Button>
          <Button transparent onPress={toglPlayer}>
            {loadingSound ? (
              <ActivityIndicator color={backgroundColor} animating={true} size={16} />
            ) : (
              <Icon
                size={24}
                style={{ color: backgroundColor }}
                name={isPlaying ? "ios-square" : "ios-play"}
              />
            )}
          </Button>
          <Button transparent onPress={nextAya}>
            <Icon
              size={24}
              style={{ color: backgroundColor }}
              name="play-skip-forward-circle-sharp"
            />
          </Button>
        </Header>
        <Content padder>
          <Card style={{ backgroundColor }}>
            <List style={{ backgroundColor }}>
              <ListItem>
                <Text style={{ margin: 10, color }}>
                  {aya + ")"} {text}
                </Text>
              </ListItem>
            </List>
          </Card>
        </Content>
        <SimplePicker
          ref={"picker"}
          options={this.options}
          labels={this.labels}
          confirmText={this.lang["confirme"]}
          cancelText={this.lang["cancel"]}
          itemStyle={{
            fontSize: 25,
            color: "#000",
            textAlign: "center",
            fontWeight: "bold",
          }}
          onSubmit={changeTarjama}
        />
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, tarjama, lang, fontSize, theme }) => ({
  wino,
  tarjama,
  lang,
  fontSize,
  theme,
});

const mapDispatchToProps = {
  setTarjama,
  reRender,
};
export default connect(mapStateToProps, mapDispatchToProps)(Tarajem);
