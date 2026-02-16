//import Expo, { FileSystem as FS, Asset, SQLite } from "expo";
import React, { Component } from "react";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Item,
  List,
  ListItem,
  Label,
  Input,
  Body,
  CardItem,
  Card,
  Left,
  Right,
  Icon,
  Form,
  Text,
  View
} from "native-base";

import { ScrollView, StyleSheet } from "react-native";
//import ModalSelector from "react-native-modal-selector";
export default class Tarajem extends Component {
  /**wino**/
  goBack = arg => {
    const { togl } = this.props;
    if (togl) togl("close");
  };
  render() {
    const {
      nextAya,
      prevAya,
      isPlaying,
      wino: { sura, aya },
      toglPlayer,
      text,
      togl,
      lang,
      color,
      backgroundColor
    } = this.props;

    return (
      <Container style={{ backgroundColor }}>
      
        <Header style={{ backgroundColor: color }}>
          <Left>
            <Button transparent onPress={() => togl("close")}>
              <Icon style={{ color: backgroundColor }} name="ios-arrow-down" />
            </Button>
          </Left>
          <Body>
            <Text style={{ color: backgroundColor }} note>
              {lang["sura"]}: {sura}, {lang["aya"]}: {aya}
            </Text>
            <Text style={{ color: backgroundColor }} note>
              الميسر
            </Text>
          </Body>
          <Right>
            <Button transparent onPress={prevAya}>
              <Icon
                style={{ color: backgroundColor }}
                name="md-skip-backward"
              />
            </Button>
            <Button transparent onPress={toglPlayer}>
              <Icon
                style={{ color: backgroundColor }}
                name={isPlaying ? "ios-square" : "md-play"}
              />
            </Button>
            <Button transparent onPress={nextAya}>
              <Icon style={{ color: backgroundColor }} name="md-skip-forward" />
            </Button>
          </Right>
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
      </Container>
    );
  }
}
