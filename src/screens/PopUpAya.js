import React, { Component } from "react";
import { Platform, View } from "react-native";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  //Icon,
  ListItem,
  Text,
  Left,
  Right,
  Body,

  Separator
} from "native-base";

import { Ionicons as Icon } from "@expo/vector-icons";
export default class PopUpAya extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem: undefined
    };
  }

  render() {
    const { menu, togl } = this.props;
    return (
      <View
        style={{
          backgroundColor: "white",
          padding: 22,
          //justifyContent: "center",
         // alignItems: "center",
          borderRadius: 3,
          borderColor: "rgba(0, 0, 0, 0.1)",
          height: 300
        }}
      >
    
            <Separator bordered />

            <ListItem icon>
              <Left>
                <Button
                  onPress={() => menu("copy")}
                  style={{ backgroundColor: "#FD3C2D" }}
                >
                  <Icon active name="notifications" />
                </Button>
              </Left>
              <Body>
                <Text>Copy</Text>
              </Body>
              <Right>
                {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
              </Right>
            </ListItem>
            <ListItem icon>
              <Left>
                <Button
                  onPress={() => menu("share")}
                  style={{ backgroundColor: "#8F8E93" }}
                >
                  <Icon active name="switch" />
                </Button>
              </Left>
              <Body>
                <Text>Share</Text>
              </Body>
              <Right>
                {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
              </Right>
            </ListItem>
            <ListItem icon last>
              <Left>
                <Button
                  onPress={() => menu("note")}
                  style={{ backgroundColor: "#5855D6" }}
                >
                  <Icon active name="moon" />
                </Button>
              </Left>
              <Body>
                <Text>Note</Text>
              </Body>
              <Right>
                <Text>Voice</Text>
              </Right>
            </ListItem>

            <ListItem icon>
              <Left>
                <Button
                  onPress={() => menu("tafsir")}
                  style={{ backgroundColor: "#FD3C2D" }}
                >
                  <Icon active name="notifications" />
                </Button>
              </Left>
              <Body>
                <Text>Tafsir</Text>
              </Body>
              <Right>
                {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
              </Right>
            </ListItem>
            <ListItem icon>
              <Left>
                <Button
                  onPress={() => menu("play")}
                  style={{ backgroundColor: "#8F8E93" }}
                >
                  <Icon active name="switch" />
                </Button>
              </Left>
              <Body>
                <Text>Play</Text>
              </Body>
              <Right>
                {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
              </Right>
            </ListItem>
            <ListItem icon last>
              <Left>
                <Button
                  onPress={() => togl("close")}
                  style={{ backgroundColor: "#5855D6" }}
                >
                  <Icon active name="moon" />
                </Button>
              </Left>
              <Body>
                <Text>Close</Text>
              </Body>
              <Right>
                {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
              </Right>
            </ListItem>
      
      </View>
    );
  }
}
