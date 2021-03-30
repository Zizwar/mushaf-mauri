import React, { Component } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Tafsir from "./Tafsir";

import GestureView from "../node/GestureView";

export default class Tray extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bounceValue: new Animated.Value(300),
    };
    this.isHidden = true;
    this.toValue = 0;
  }
  UNSAFE_componentWillMount() {}
  _toggleSubview() {
    this.toValue = 300;

    if (this.isHidden) this.toValue = 0;

    Animated.spring(this.state.bounceValue, {
      toValue: this.toValue,
      velocity: 3,
      tension: 2,
      friction: 8,
    }).start();

    this.isHidden = !this.isHidden;
  }
  //  //
  onSwipe = () => this._toggleSubview();

  render() {
    return (
      <View>
        <Animated.View
          style={[
            styles.subView,
            { transform: [{ translateY: this.state.bounceValue }] },
          ]}
        >
          <GestureView
            onSwipeUp={() => this.onSwipe("up")}
            onSwipeDown={() => this.onSwipe("down")}
          >
            <Tafsir />
          </GestureView>
        </Animated.View>
      </View>
    );
  }
}

//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#346",
    marginTop: 66,
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
  },
  button: {
    width: 60,
    height: 40,
    backgroundColor: "green",
  },
  subView: {
    position: "relative",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    height: 250,
  },
});
