import React, { Component } from "react";
//import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal"; // 2.4.0

export default class Modalino extends Component {
  render() {
    const {
      visible,
      togl,
      data,
      position,
      noSwipe,
      backDrop,
      style,
      opacity,
      disbledSwip,
      animationIn = "slideInUp",
      animationOut = "slideOutDown"
    } = this.props;
    return (
      <Modal
        isVisible={visible}
        backdropColor={"#000"}
        backdropOpacity={opacity ? opacity : 0.5}
        animationIn={animationIn}
        animationOut={animationOut}
        //scrollOffsetMax={400 - 300}
        style={
          position == "down"
            ? {
                justifyContent: "flex-end",
                margin: 0
              }
            : style
            ? style
            : null
        }
        onBackdropPress={() => {
          if (!backDrop) {
            togl("close");
            return null;
          }
        }}
        onBackButtonPress={() => {
          if (!backDrop) {
            togl("close");
            return null;
          }
        }}
        // onBackButtonPress={() => togl("close")}
        onSwipe={() => {
          if (!noSwipe) togl("close");
        }}
        swipeDirection={disbledSwip ? null : "down"}
      >
        {data}
      </Modal>
    );
  }
}
