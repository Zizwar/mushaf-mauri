import React, {Component} from 'react';
import {
  
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Animated
}  from 'react-native';




export default class Tray extends Component {
  constructor(props) {
    super(props);
     this.isHidden = true;
    this.toValue = 300
    this.state = {
      bounceValue: this.toValue,  //This is the initial position of the subview
      buttonText: "Show Subview"
      
    };
   
  }


  togleTray=()=> {    
    this.setState({
      buttonText: !this.isHidden ? "Show Subview" : "Hide Subview"
    });

    const toValue = this.toValue;

    if(this.isHidden) {
      toValue = 0;
    }
  Animated.spring(
      this.state.bounceValue,
      {
        toValue: toValue,
        velocity: 3,
        tension: 2,
        friction: 8,
      }
    ).start();

    this.isHidden = !this.isHidden;
  }

  render() {
    return (
      <View style={styles.containerTray}>
          <TouchableHighlight onPress={()=> {this._toggleSubview()}}>
            <Text >{this.state.buttonText}</Text>
          </TouchableHighlight>
          <Animated.View
            style={[styles.subView,
              {transform: [{translateY: this.state.bounceValue}]}]}
          >
            <Text>This is a sub view</Text>
          </Animated.View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  containerTray: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginTop: 66
  },

  subView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    height: 100,
  }
});
