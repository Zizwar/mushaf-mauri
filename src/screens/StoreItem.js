import React, { Component } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Body,
  Header,
  View,
  Text,
  List,
  Left,
  Button,
  Right,
  ScrollableTab,
  Tab,
  TabHeading,
  ListItem,
  Tabs,
  Title,
} from "native-base";

import { Icon } from "../component";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 250;
const HEADER_HEIGHT = Platform.OS === "ios" ? 64 : 50;
const SCROLL_HEIGHT = IMAGE_HEIGHT - HEADER_HEIGHT;
const THEME_COLOR = "rgba(65,117,5,1)";
const FADED_THEME_COLOR = "rgba(85,186,255, 0.8)";

class StoreItem extends Component {
  nScroll = new Animated.Value(0);
  scroll = new Animated.Value(0);
  textColor = this.scroll.interpolate({
    inputRange: [0, SCROLL_HEIGHT / 5, SCROLL_HEIGHT],
    outputRange: [THEME_COLOR, FADED_THEME_COLOR, "white"],
    extrapolate: "clamp",
  });
  tabBg = this.scroll.interpolate({
    inputRange: [0, SCROLL_HEIGHT],
    outputRange: ["white", THEME_COLOR],
    extrapolate: "clamp",
  });
  tabY = this.nScroll.interpolate({
    inputRange: [0, SCROLL_HEIGHT, SCROLL_HEIGHT + 1],
    outputRange: [0, 0, 1],
  });
  headerBg = this.scroll.interpolate({
    inputRange: [0, SCROLL_HEIGHT, SCROLL_HEIGHT + 1],
    outputRange: ["transparent", "transparent", THEME_COLOR],
    extrapolate: "clamp",
  });
  imgScale = this.nScroll.interpolate({
    inputRange: [-25, 0],
    outputRange: [1.1, 1],
    extrapolateRight: "clamp",
  });
  imgOpacity = this.nScroll.interpolate({
    inputRange: [0, SCROLL_HEIGHT],
    outputRange: [1, 0],
  });

  heights = [500, 500];
  state = {
    activeTab: 0,
    height: 500,
  };

  constructor(props) {
    super(props);
    this.nScroll.addListener(
      Animated.event([{ value: this.scroll }], { useNativeDriver: false })
    );
  }
  goBack = () => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  //
  render() {
    const {
      downloadDB,
      testDB,
      title,
      loadingItem,
      description,
      fullName,
    } = this.props;
    return (
      <View>
        <Animated.View
          style={{
            position: "absolute",
            width: "100%",
            backgroundColor: this.headerBg,
            zIndex: 1,
          }}
        >
          <Header style={{ backgroundColor: "transparent" }} hasTabs>
            <Left>
              <Button transparent onPress={this.goBack}>
                <Icon name="ios-close" />
              </Button>
            </Left>
            <Body>
              <Title>
                <Animated.Text
                  style={{ color: this.textColor, fontWeight: "bold" }}
                >
                  {title}
                </Animated.Text>
              </Title>
            </Body>
            <Right>
              <Button
                style={{ color: "#FF4" }}
                onPress={downloadDB}
                onLongPress={testDB}
              >
                {loadingItem ? (
                  <ActivityIndicator animating={true} size={32} />
                ) : (
                  <Icon color="#f44" name="arrow-down" />
                )}
              </Button>
            </Right>
          </Header>
        </Animated.View>
        <Animated.ScrollView
          scrollEventThrottle={5}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.nScroll } } }],
            { useNativeDriver: true }
          )}
          style={{ zIndex: 0 }}
        >
          <Animated.View
            style={{
              transform: [
                { translateY: Animated.multiply(this.nScroll, 0.65) },
                { scale: this.imgScale },
              ],
              backgroundColor: THEME_COLOR,
            }}
          >
            <Animated.Image
              source={{
                uri:
                  "https://cdn2.bigcommerce.com/n-d57o0b/bxx1yj/products/1334/" +
                  "images/2635/Tafsir_Ibn_Katheer_6_Vol_Urdu_Set_1__44040." +
                  "1540400013.1280.1280.jpg?c=2",
              }}
              style={{
                height: IMAGE_HEIGHT,
                width: "100%",
                opacity: this.imgOpacity,
              }}
            />
          </Animated.View>
          <Tabs
            prerenderingSiblingsNumber={3}
            onChangeTab={({ i }) => {
              this.setState({ height: this.heights[i], activeTab: i });
            }}
            renderTabBar={(props) => (
              <Animated.View
                style={{
                  transform: [{ translateY: this.tabY }],
                  zIndex: 1,
                  width: "100%",
                  backgroundColor: "white",
                }}
              >
                <ScrollableTab
                  {...props}
                  renderTab={(name, page, active, onPress, onLayout) => (
                    <TouchableOpacity
                      key={page}
                      onPress={() => onPress(page)}
                      onLayout={onLayout}
                      activeOpacity={0.4}
                    >
                      <Animated.View
                        style={{
                          flex: 1,
                          height: 100,
                          backgroundColor: this.tabBg,
                        }}
                      >
                        <TabHeading
                          scrollable
                          style={{
                            backgroundColor: "transparent",
                            width: SCREEN_WIDTH / 2,
                          }}
                          active={active}
                        >
                          <Animated.Text
                            style={{
                              fontWeight: active ? "bold" : "normal",
                              color: this.textColor,
                              fontSize: 14,
                            }}
                          >
                            {name}
                          </Animated.Text>
                        </TabHeading>
                      </Animated.View>
                    </TouchableOpacity>
                  )}
                  underlineStyle={{ backgroundColor: this.textColor }}
                />
              </Animated.View>
            )}
          >
            <Tab heading={fullName}>
              <List>
                <ListItem>
                  <Body>
                    <View style={{ margin: 10 }}>
                      <Text>{description}</Text>
                    </View>
                  </Body>
                </ListItem>
                <ListItem style={{ hight: 200 }}>
                  <Text></Text>
                </ListItem>
              </List>
            </Tab>
          </Tabs>
        </Animated.ScrollView>
        {/* <Footer>
            <Text>footer</Text>
        </Footer>
         */}
      </View>
    );
  }
}
export default StoreItem;
