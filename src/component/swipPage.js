import React, { Component } from "react";
import { View, Dimensions, TouchableOpacity, Image, Text } from "react-native";
import { Text as TextRB, Button } from "native-base";

import Swiper from "react-native-swiper";
//import { getImagePageUri } from "../api";

const { width, height } = Dimensions.get("window");

const styles = {
  slide1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9DD6EB"
  },

  slide2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#97CAE5"
  },

  slide3: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#92BBD9"
  },

  text: {
    color: "#fff"
    //fontSize: 30,
    //fontWeight: "bold"
  }
};

export default class SwipPaeg extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vi: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
        { id: 9 },
        { id: 10 }
      ].reverse(),
      index: 9,
      showViewer: true
    };
    this.lastIndex = 9;
  }

  nextPageArray = (start, end) => {
    this.setState({
      showViewer: false
    });
    let item = [];
    let _start = start ? start : this.lastIndex ? this.lastIndex : 1;
    let _end = end ? end : this.lastIndex + 9;
    if (_end > 604) _end = 604;
    for (i = _start; i <= _end; i++) {
      item.push({ id: i });
    }
    const lastIndex = _end - _start;
    this.lastIndex = lastIndex ? this.lastIndex + lastIndex : 1;
    console.log(
      "play next array(start,end,index) =",
      _start,
      _end,
      this.lastIndex
    );
    this.setState({
      vi: item.reverse(),
      //  firstItem:14//this.lastIndex
      showViewer: true,
      index: 9
    });
    setTimeout(_ => {
      if (this._swiper) this._swiper.scrollBy(9);
    }, 100);
  };

  onPressViewer = ({ id, index }) => {
    this.setState({
      index: 5
    });
    return;
    console.log({ id, index });

    this.setState({
      vi: [
        { id: 11 },
        { id: 12 },
        { id: 13 },
        { id: 14 },
        { id: 15 },
        { id: 16 },
        { id: 17 },
        { id: 18 },
        { id: 19 },
        { id: 20 },
        { id: 21 }
      ].reverse(),
      showViewer: true,
      showIndex: 10,
      index: 9
    });
  };
  _onIndexChanged = index => {
    console.log({ index });
    this.setState({ index });
    if (index === 0) this.nextPageArray();
  };
  _onMomentumScrollEnd = (e, state, context) =>
    console.log({ e, state, context });

  render() {
    return (
      <Swiper
        ref={swiper => {
          this._swiper = swiper;
        }}
        autoplay={false}
        // showsPagination={false}
        loop={false}
        onMomentumScrollEnd={this._onMomentumScrollEnd}
        onIndexChanged={this._onIndexChanged}
        //onPressViewer={this.onPressViewer}
        index={this.state.index}
      >
        {this.state.vi.map(({ id }, index) => (
          <View key={index}>
            <Image
              key={id + "_" + index}
              style={{
                position: "absolute",
                borderRadius: 3,
                top: 0,
                left: 0,
                width,
                height: height - 5
                // flex: 1
              }}
              source={{ uri: `http://quran.ksu.edu.sa/warsh/${id}.png` }}
            />
            <Button
              style={{
                position: "absolute",
                borderRadius: 3,
                top: 0,
                left: 0,
                height,
                backgroundColor: "#F44",
                opacity: 0.2,
                width
              }}
              //key={index}
              //  onPress={_ => this.onPressViewer({ id, index })}
              onPress={() => this._swiper.scrollBy(5)}
              onLongPress={_ => {
                if (this.swiper) this.swiper.scrollBy(9, (animated = false));
              }}
            >
              <Text>
                page {id}, index {index}
              </Text>
            </Button>
          </View>
        ))}
      </Swiper>
    );
  }
}
