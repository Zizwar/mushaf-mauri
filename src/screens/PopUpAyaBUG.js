import React, { Component } from "react";
import { Platform } from "react-native";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Icon,
  ListItem,
  Text,
  Left,
  Right,
  Body,
  Separator
} from "native-base";



export default class PopUpAya extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem: undefined,
    
    };
  }

  render() {
   // const onpress = this.props.menu;
    const onpress =arg=>alert(arg);
    return (
      <Container style={{ backgroundColor: "#FFF" }}>
        <Header>
          <Left>
            <Button transparent onPress={() => this.props.togl('close')}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>Options</Title>
          </Body>
          <Right />
        </Header>

        <Content>
         // <Separator bordered noTopBorder />
          <ListItem icon>
            <Left>
              <Button onPress={() => onpress('copy','copy')} style={{ backgroundColor: "#FD3C2D" }}>
                <Icon active name="sha" />
              </Button>
            </Left>
            <Body>
              <Text>Notifications</Text>
            </Body>
            <Right>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          <ListItem icon>
            <Left>
              <Button onPress={() => onpress('share','share')} style={{ backgroundColor: "#FD3C2D" }} style={{ backgroundColor: "#8F8E93" }}>
                <Icon active name="switch" />
              </Button>
            </Left>
            <Body>
              <Text>Share Aya</Text>
            </Body>
            <Right>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          <ListItem icon last>
            <Left>
              <Button onPress={() => onpress('tafsir','tafsir')} style={{ backgroundColor: "#FD3C2D" }} style={{ backgroundColor: "#5855D6" }}>
                <Icon active name="moon" />
              </Button>
            </Left>
            <Body>
              <Text>TAfsir Aya</Text>
            </Body>
            <Right>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          <Separator bordered />
                <ListItem icon>
            <Left>
              <Button onPress={() => onpress('note','note')} style={{ backgroundColor: "#FD3C2D" }} style={{ backgroundColor: "#FD3C2D" }}>
                <Icon active name="sha" />
              </Button>
            </Left>
            <Body>
              <Text>Note</Text>
            </Body>
            <Right>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          <ListItem icon>
            <Left>
              <Button onPress={() => onpress('play','play')} style={{ backgroundColor: "#FD3C2D" }} style={{ backgroundColor: "#8F8E93" }}>
                <Icon active name="switch" />
              </Button>
            </Left>
            <Body>
              <Text>Play </Text>
            </Body>
            <Right>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          <ListItem icon last>
            <Left>
              <Button onPress={() => this.props.togl('close')} style={{ backgroundColor: "#5855D6" }}>
                <Icon active name="moon" />
              </Button>
            </Left>
            <Body>
              <Text>close</Text>
            </Body>
            <Right>
            {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
              </Right>
          </ListItem>
          <Separator bordered />
      
        </Content>
      </Container>
    );
  }
}


